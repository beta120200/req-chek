// ============================================================
// Shared document state, loaded from the Express API.
//
//   GET    /api/documents          -> library (all document types) + the user's records
//   POST   /api/documents          -> save / update one record
//   DELETE /api/documents/:id      -> clear one record
//   DELETE /api/documents          -> clear all records
//
// Any component importing `documents` / `documentLibrary` reads the SAME
// reactive objects. Only signed-in users have documents (guests have none).
// ============================================================
import { api } from '../api/client.js';
import { showToast } from './toastState.svelte.js';
import { rebuildNotifications } from './notificationState.svelte.js';
import { authState } from './authState.svelte.js';
import { dataVersion } from '../api/resource.svelte.js';
import { guestState, guestSaveDocument, guestRemoveDocument, guestClearDocuments } from './guestState.svelte.js';

/** @type {Record<string, {id: string, name: string, source: string, expirable: boolean}>} */
export const documentLibrary = $state({});

/** @type {Record<string, {held: boolean, issueDate: string|null, expiryDate: string|null, notes: string, status: string, remaining: number|null}>} */
export const documents = $state({});

export const documentsStatus = $state({
  loaded: false,
  loading: false,
  /** @type {string | null} */ error: null,
});

function replaceContents(target, source) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, source);
}

/** Fetches the library and the user's records. Safe to call repeatedly. */
export async function loadDocuments() {
  documentsStatus.loading = true;
  documentsStatus.error = null;
  try {
    const data = await api.get('/api/documents');

    if (authState.isGuest) {
      // notes stay in the browser (they aren't sent to the API), so merge them back in
      for (const [id, doc] of Object.entries(data.documents)) doc.notes = guestState.documents[id]?.notes ?? '';
    }

    replaceContents(documentLibrary, Object.fromEntries(data.library.map((d) => [d.id, d])));
    replaceContents(documents, data.documents);
    documentsStatus.loaded = true;
    rebuildNotifications(documents, documentLibrary);
  } catch (err) {
    documentsStatus.error = err instanceof Error ? err.message : 'Failed to load documents.';
  } finally {
    documentsStatus.loading = false;
  }
}

/** Forget everything (used on logout). */
export function resetUserData() {
  replaceContents(documentLibrary, {});
  replaceContents(documents, {});
  documentsStatus.loaded = false;
  documentsStatus.error = null;
  rebuildNotifications(documents, documentLibrary);
}

/**
 * Adds/updates a document's details and marks it held.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function saveDocument(docId, { issueDate = null, expiryDate = null, notes = '' } = {}) {
  try {
    if (authState.isGuest) {
      guestSaveDocument(docId, { issueDate, expiryDate, notes }, documentLibrary[docId]?.name);
    } else {
      await api.post('/api/documents', { documentId: docId, held: true, issueDate, expiryDate, notes });
    }
    await loadDocuments();
    dataVersion.n++;
    showToast(`${documentLibrary[docId]?.name || 'Document'} saved.`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to save document.' };
  }
}

/** Clears one document record back to "not held". */
export async function removeDocument(docId) {
  const name = documentLibrary[docId]?.name || 'Document';
  try {
    if (authState.isGuest) guestRemoveDocument(docId, name);
    else await api.delete(`/api/documents/${encodeURIComponent(docId)}`);
    await loadDocuments();
    dataVersion.n++;
    showToast(`${name} removed.`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to remove document.' };
  }
}

/** Clears every document record. */
export async function resetDocuments() {
  try {
    if (authState.isGuest) guestClearDocuments();
    else await api.delete('/api/documents');
    await loadDocuments();
    dataVersion.n++;
    showToast('All document records cleared.');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to clear documents.' };
  }
}
