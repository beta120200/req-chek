import { daysUntil } from './dates.js';

export const EXPIRING_SOON_DAYS = 30;

/**
 * @typedef {{ held: boolean, issueDate: string|null, expiryDate: string|null, notes: string }} UserDocument
 */

/** 'not-held' | 'valid' | 'expiring' | 'expired' */
export function documentStatus(documents, docId) {
  const doc = documents[docId];
  if (!doc?.held) return 'not-held';
  const remaining = daysUntil(doc.expiryDate);
  if (remaining === null) return 'valid';
  if (remaining < 0) return 'expired';
  if (remaining <= EXPIRING_SOON_DAYS) return 'expiring';
  return 'valid';
}

export function isValid(documents, docId) {
  const status = documentStatus(documents, docId);
  return status === 'valid' || status === 'expiring';
}

function evaluateOption(option, documents, library) {
  const steps = [];
  if (option.dependsOn) {
    steps.push({
      docId: option.dependsOn,
      name: library[option.dependsOn]?.name || 'Unknown',
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
    option: { id: option.id, docId: option.docId, name: option.name, dependsOn: option.dependsOn },
    steps,
    completed,
    total: steps.length,
    progress: completed / steps.length,
    satisfied: isValid(documents, option.docId),
    expiringSoon: documentStatus(documents, option.docId) === 'expiring',
  };
}

/**
 * Evaluates one requirement ("one_of" or "min_count") against the user's documents.
 * @returns {{ satisfied: boolean, bestPath: object|null, paths: object[], percent: number, word: string }}
 */
export function evaluateRequirement(requirement, documents, library) {
  const paths = requirement.options.map((o) => evaluateOption(o, documents, library));
  if (paths.length === 0) {
    return { satisfied: false, bestPath: null, paths, percent: 0, word: 'Not Ready' };
  }

  // Most progress first; ties broken by fewest remaining steps.
  const ranked = [...paths].sort((a, b) => b.progress - a.progress || a.total - b.total);
  const satisfiedPaths = paths.filter((p) => p.satisfied);

  let satisfied;
  let bestPath;
  let percent;

  if (requirement.type === 'min_count') {
    const needed = Math.max(1, requirement.minCount ?? 1);
    satisfied = satisfiedPaths.length >= needed;
    bestPath = satisfied ? satisfiedPaths[0] : ranked[0];
    percent = Math.min(100, Math.round((satisfiedPaths.length / needed) * 100));
  } else {
    // 'one_of'
    satisfied = satisfiedPaths.length > 0;
    bestPath = satisfied ? satisfiedPaths[0] : ranked[0];
    percent = satisfied ? 100 : Math.round(bestPath.progress * 100);
  }

  let word = 'Not Ready';
  if (satisfied) word = 'Ready';
  else if (percent >= 50) word = 'Almost There';
  else if (percent > 0) word = 'In Progress';

  return { satisfied, bestPath, paths, percent, word };
}

/** Readiness summary for a catalog service (a service with no requirement is "Not Ready"). */
export function evaluateService(service, documents, library) {
  if (!service.requirement) {
    return { satisfied: false, bestPath: null, paths: [], percent: 0, word: 'Not Ready' };
  }
  return evaluateRequirement(service.requirement, documents, library);
}

/** Compact per-path shape sent to the client. */
export function serializePath(path) {
  return {
    option: { id: path.option.id, name: path.option.name, dependsOn: path.option.dependsOn },
    steps: path.steps.map((s) => ({
      docId: s.docId, name: s.name, held: s.held, status: s.status, role: s.role,
    })),
    completed: path.completed,
    total: path.total,
    progress: path.progress,
    satisfied: path.satisfied,
    expiringSoon: path.expiringSoon,
  };
}
