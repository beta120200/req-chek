// ============================================================
// Readiness engine — pure functions, no state in here.
//
// For the "one_of" requirement, each option is scored as a
// short chain of steps (an optional prerequisite, then the ID
// itself). The "best path" is whichever option is already
// satisfied, or — if none is — whichever option the applicant
// has made the most progress toward, so ReqCheck always
// recommends the path that wastes the least of what they
// already have.
//
// For the "min_count" requirement, the applicant needs at least
// minCount options to be satisfied. The "best path" shows
// progress toward the requirement: when not satisfied, it's the
// option with the most progress; when satisfied, it's any
// satisfied option.
//
// A document that's held but PAST its expiry date does not
// count as satisfying anything (an expired ID isn't accepted).
// A document expiring soon still counts, but is flagged so the
// UI (and Notifications) can warn about it.
// ============================================================

import { DOCUMENT_LIBRARY } from './serviceData.js';

const EXPIRING_SOON_DAYS = 30;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

/**
 * Status of a single document record, independent of any
 * requirement: 'not-held' | 'expired' | 'expiring' | 'valid'.
 */
export function documentStatus(documents, docId) {
  const doc = documents[docId];
  if (!doc?.held) return 'not-held';
  const remaining = daysUntil(doc.expiryDate);
  if (remaining === null) return 'valid';
  if (remaining < 0) return 'expired';
  if (remaining <= EXPIRING_SOON_DAYS) return 'expiring';
  return 'valid';
}

export function daysUntilExpiry(documents, docId) {
  return daysUntil(documents[docId]?.expiryDate);
}

/** Whether a document currently counts toward a requirement (held + not expired). */
export function isValid(documents, docId) {
  const status = documentStatus(documents, docId);
  return status === 'valid' || status === 'expiring';
}

/**
 * Builds the ordered step chain for a single requirement option
 * and scores how much of it the applicant already has.
 */
export function evaluateOption(documents, option) {
  const steps = [];
  if (option.dependsOn) {
    steps.push({
      docId: option.dependsOn,
      name: DOCUMENT_LIBRARY[option.dependsOn].name,
      held: isValid(documents, option.dependsOn),
      status: documentStatus(documents, option.dependsOn),
      role: 'prerequisite',
    });
  }
  steps.push({
    docId: option.docId,
    name: option.name,
    held: isValid(documents, option.docId),
    status: documentStatus(documents, option.docId),
    role: 'target',
  });

  const completed = steps.filter((s) => s.held).length;
  return {
    option,
    steps,
    completed,
    total: steps.length,
    progress: completed / steps.length,
    satisfied: isValid(documents, option.docId),
    expiringSoon: documentStatus(documents, option.docId) === 'expiring',
  };
}

/**
 * Evaluates the whole requirement against the applicant's
 * documents and picks the recommended path.
 * Handles both 'one_of' and 'min_count' requirement types.
 */
export function evaluateRequirement(documents, requirement) {
  const paths = requirement.options.map((o) => evaluateOption(documents, o));

  // Handle different requirement types
  let satisfied = false;
  let bestPath = null;

  if (requirement.type === 'min_count') {
    // For min_count, we're satisfied if at least minCount options are satisfied
    const satisfiedCount = paths.filter((p) => p.satisfied).length;
    satisfied = satisfiedCount >= requirement.minCount;

    // For bestPath in min_count, we still want to show the most progressed option
    // when not satisfied, or any satisfied option when satisfied
    if (satisfied) {
      // When satisfied, pick the first satisfied option as bestPath
      bestPath = paths.find((p) => p.satisfied) || paths[0];
    } else {
      // When not satisfied, pick the option with most progress
      bestPath = [...paths].sort(
        (a, b) => b.progress - a.progress || a.total - b.total
      )[0];
    }
  } else {
    // Default to 'one_of' logic (backward compatibility)
    const satisfiedPath = paths.find((p) => p.satisfied);
    satisfied = !!satisfiedPath;

    if (satisfiedPath) {
      bestPath = satisfiedPath;
    } else {
      // No option satisfied yet — recommend whichever has the most
      // progress already banked; break ties by fewest remaining steps.
      bestPath = [...paths].sort(
        (a, b) => b.progress - a.progress || a.total - b.total
      )[0];
    }
  }

  return { satisfied, bestPath, paths };
}

/** Turns the recommended path into an ordered preparation route. */
export function buildRoute(documents, service) {
  const { bestPath, satisfied } = evaluateRequirement(documents, service.requirement);

  const steps = bestPath.steps.map((step, i) => ({
    id: step.docId,
    title: step.held
      ? `${step.name} on hand`
      : step.role === 'prerequisite'
        ? `Obtain ${step.name}`
        : `Apply for ${step.name}`,
    detail: step.held
      ? step.status === 'expiring'
        ? `On hand, but expiring soon — consider renewing.`
        : 'Already recorded in your document inventory.'
      : DOCUMENT_LIBRARY[step.docId]?.source
        ? `Source: ${DOCUMENT_LIBRARY[step.docId].source}`
        : '',
    done: step.held,
    warning: step.status === 'expiring',
    order: i + 1,
  }));

  steps.push({
    id: 'apply',
    title: `Apply for ${service.name} at ${service.office}`,
    detail: satisfied
      ? 'Your Primary Identification requirement is satisfied — you can go in now.'
      : 'Available once your Primary Identification requirement is satisfied.',
    done: false,
    warning: false,
    order: steps.length + 1,
  });

  return steps;
}

export function readinessWord(progress, satisfied) {
  if (satisfied) return 'Ready';
  if (progress >= 0.5) return 'Almost There';
  if (progress > 0) return 'In Progress';
  return 'Not Ready';
}
