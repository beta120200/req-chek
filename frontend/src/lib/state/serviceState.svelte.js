// ============================================================
// The user's tracked services, loaded from the Express API.
//
//   GET    /api/check-readiness              -> tracked services + readiness
//   POST   /api/add-service                  -> track a service (becomes active)
//   PUT    /api/user-services/:id/active     -> switch the active service
//   DELETE /api/user-services/:id            -> stop tracking a service
// ============================================================
import { api } from '../api/client.js';
import { showToast } from './toastState.svelte.js';
import { authState } from './authState.svelte.js';
import { dataVersion } from '../api/resource.svelte.js';
import { guestAddService, guestSetActiveService, guestRemoveService } from './guestState.svelte.js';

export const serviceState = $state({
  /** @type {Array<{id: string, name: string, [key: string]: any}>} */
  selected: [],
  /** @type {string | null} */
  activeServiceId: null,
  loaded: false,
});

export async function loadServices() {
  try {
    const data = await api.get('/api/check-readiness');
    serviceState.selected = data.selectedServices;
    serviceState.activeServiceId = data.activeServiceId;
    serviceState.loaded = true;
  } catch (err) {
    console.error('Failed to load services:', err);
  }
}

export function resetServices() {
  serviceState.selected = [];
  serviceState.activeServiceId = null;
  serviceState.loaded = false;
}

/**
 * Track a service and make it the active one.
 * @param {{id: string, name?: string}} serviceToAdd
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function addService(serviceToAdd) {
  try {
    if (authState.isGuest) guestAddService(serviceToAdd.id, serviceToAdd.name);
    else await api.post('/api/add-service', { serviceId: serviceToAdd.id });
    await loadServices();
    dataVersion.n++;
    showToast(`${serviceToAdd.name || 'Service'} added to your dashboard.`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not add the service.' };
  }
}

/** @param {string} serviceId */
export async function setActiveService(serviceId) {
  try {
    if (authState.isGuest) guestSetActiveService(serviceId);
    else await api.put(`/api/user-services/${encodeURIComponent(serviceId)}/active`, {});
    serviceState.activeServiceId = serviceId;
    dataVersion.n++;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not switch service.' };
  }
}

/** @param {string} serviceId */
export async function removeService(serviceId) {
  try {
    if (authState.isGuest) guestRemoveService(serviceId);
    else await api.delete(`/api/user-services/${encodeURIComponent(serviceId)}`);
    await loadServices();
    dataVersion.n++;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not remove the service.' };
  }
}
