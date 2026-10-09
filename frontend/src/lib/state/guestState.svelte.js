// In-memory data for guests ("Continue as guest"). Lost on page reload by design.
const MAX_ACTIVITY = 8;

export const guestState = $state({
  documents: {}, // docId -> { held, issueDate, expiryDate, notes }
  services: [], // tracked service ids, oldest first
  activeServiceId: null,
  activity: [], // newest first: { id, title, createdAt }
});

function log(title) {
  guestState.activity = [
    { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, createdAt: new Date().toISOString() },
    ...guestState.activity,
  ].slice(0, MAX_ACTIVITY);
}

/** Value for the X-Guest-Context header (notes stay local to keep the header small). */
export function guestContextHeader() {
  const snap = $state.snapshot(guestState);
  const documents = {};
  for (const [id, d] of Object.entries(snap.documents)) {
    documents[id] = { held: d.held, issueDate: d.issueDate, expiryDate: d.expiryDate };
  }
  return encodeURIComponent(
    JSON.stringify({ documents, services: snap.services, activeServiceId: snap.activeServiceId, activity: snap.activity }),
  );
}

export function resetGuestData() {
  guestState.documents = {};
  guestState.services = [];
  guestState.activeServiceId = null;
  guestState.activity = [];
}

export function guestSaveDocument(docId, { issueDate = null, expiryDate = null, notes = '' } = {}, name = docId) {
  guestState.documents[docId] = { held: true, issueDate, expiryDate, notes };
  log(`${name} saved`);
}
export function guestRemoveDocument(docId, name = docId) {
  delete guestState.documents[docId];
  log(`${name} removed from inventory`);
}
export function guestClearDocuments() {
  guestState.documents = {};
  log('All document records cleared');
}
export function guestAddService(serviceId, name = 'Service') {
  if (!guestState.services.includes(serviceId)) guestState.services.push(serviceId);
  guestState.activeServiceId = serviceId;
  log(`${name} added to your dashboard`);
}
export function guestSetActiveService(serviceId) {
  if (guestState.services.includes(serviceId)) guestState.activeServiceId = serviceId;
}
export function guestRemoveService(serviceId) {
  guestState.services = guestState.services.filter((id) => id !== serviceId);
  if (guestState.activeServiceId === serviceId) guestState.activeServiceId = guestState.services.at(-1) ?? null;
}