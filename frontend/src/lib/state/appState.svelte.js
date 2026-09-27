// ============================================================
// Shared application state (Svelte 5 runes, module-level).
//
// Any component that imports `documents` from here reads and
// writes the SAME reactive object — no context or store
// boilerplate needed.
//
// Guest vs member behavior lives here:
//  - Guest: documents live in memory only, reset on reload.
//  - Member: documents are also written to this browser's
//    localStorage under the signed-in account's email, and
//    reloaded whenever that account signs back in.
// ============================================================

import { DOCUMENT_LIBRARY } from '../data/serviceData.js';
import { logActivity } from './activityState.svelte.js';
import { showToast } from './toastState.svelte.js';
import { authState } from './authState.svelte.js';

const DOCS_PREFIX = 'reqcheck:documents:';

function hasStorage() {
  return typeof localStorage !== 'undefined';
}

function loadDocsFor(email) {
  if (!hasStorage()) return null;
  try {
    const raw = localStorage.getItem(DOCS_PREFIX + email);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDocsFor(email, docs) {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(DOCS_PREFIX + email, JSON.stringify(docs));
  } catch {
    /* ignore */
  }
}

function daysFromToday(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function initialDocuments() {
  const initial = {};
  Object.keys(DOCUMENT_LIBRARY).forEach(docId => {
    initial[docId] = { held: false, issueDate: null, expiryDate: null, notes: '' };
  });
  return initial;
}

export const documents = $state(
  !authState.isGuest && authState.email
    ? loadDocsFor(authState.email) ?? initialDocuments()
    : initialDocuments()
);

/** Persists the current inventory for the signed-in member (no-op for guests). */
function persistIfMember() {
  if (!authState.isGuest && authState.email) {
    saveDocsFor(authState.email, documents);
  }
}

/**
 * Reloads `documents` for whoever is currently signed in — a
 * member's saved inventory, or a fresh demo set for a brand-new
 * member / a guest. Call this right after login, register,
 * continueAsGuest, or logout.
 */
export function hydrateForCurrentUser() {
  if (!authState.isGuest && authState.email) {
    Object.assign(documents, loadDocsFor(authState.email) ?? initialDocuments());
  } else {
    Object.assign(documents, initialDocuments());
  }
}

export function toggleDocument(docId) {
  const doc = documents[docId];
  doc.held = !doc.held;
  const name = DOCUMENT_LIBRARY[docId].name;
  logActivity(doc.held ? `${name} marked as held` : `${name} marked as not held`);
  showToast(doc.held ? `${name} marked as held.` : `${name} marked as not held.`);
  persistIfMember();
}

/** Adds/updates a document's details and marks it held. */
export function saveDocument(docId, { issueDate = null, expiryDate = null, notes = '' } = {}) {
  documents[docId] = { held: true, issueDate, expiryDate, notes };
  logActivity(`${DOCUMENT_LIBRARY[docId].name} details saved`);
  showToast(`${DOCUMENT_LIBRARY[docId].name} saved.`);
  persistIfMember();
}

/** Clears a document record back to "not held". */
export function removeDocument(docId) {
  documents[docId] = { held: false, issueDate: null, expiryDate: null, notes: '' };
  logActivity(`${DOCUMENT_LIBRARY[docId].name} removed from inventory`);
  showToast(`${DOCUMENT_LIBRARY[docId].name} removed.`);
  persistIfMember();
}

export function resetDocuments() {
  Object.assign(documents, initialDocuments());
  logActivity('Demo data reset');
  showToast('Demo data has been reset.');
  persistIfMember();
}
