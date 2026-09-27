// ============================================================
// User-selected services state with sessionStorage persistence
// ============================================================

import { service as ALL_SERVICES } from '../../lib/data/serviceData.js';

// Storage key for sessionStorage
const STORAGE_KEY = 'reqcheck:selectedServices';

// Check if sessionStorage is available
function hasSessionStorage() {
  return typeof sessionStorage !== 'undefined';
}

// Load selected services from sessionStorage
function loadSelectedServices() {
  if (!hasSessionStorage()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Save selected services to sessionStorage
function saveSelectedServices(services) {
  if (!hasSessionStorage()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  } catch {
    /* ignore */
  }
}

// Initialize selected services from sessionStorage or default to first service
const initialServices = loadSelectedServices();
export const selectedServices = $state(initialServices ?? [ALL_SERVICES[0]]);

// Index of the currently active service in selectedServices array
let activeServiceIndex = $state(0);

// Get the currently active service
let activeService = $derived(selectedServices[activeServiceIndex]);

/**
 * Add a service to the user's selected services if not already present
 * @param {Object} serviceToAdd - The service object to add
 */
export function addService(serviceToAdd) {
  // Check if service is already in the list
  const exists = selectedServices.some(s => s.id === serviceToAdd.id);

  if (!exists) {
    selectedServices.push(serviceToAdd);
    // Set the newly added service as active
    activeServiceIndex = selectedServices.length - 1;

    // Persist to sessionStorage
    saveSelectedServices(selectedServices);

    // Show success toast
    const toastState = require('./toastState.svelte.js').toastState;
    toastState.show(`${serviceToAdd.name} added to your dashboard.`);
  }
}

/**
 * Get the index of the currently active service
 */
export function getActiveServiceIndex() {
  return activeServiceIndex;
}

/**
 * Set the active service by index
 * @param {number} index - Index of the service to set as active
 */
export function setActiveService(index) {
  if (index >= 0 && index < selectedServices.length) {
    activeServiceIndex = index;
    // Persist to sessionStorage when active service changes
    saveSelectedServices(selectedServices);
  }
}

/**
 * Remove a service from selected services
 * @param {string} serviceId - ID of the service to remove
 */
export function removeService(serviceId) {
  const index = selectedServices.findIndex(s => s.id === serviceId);

  if (index !== -1) {
    selectedServices.splice(index, 1);

    // Adjust active index if needed
    if (activeServiceIndex >= selectedServices.length) {
      activeServiceIndex = Math.max(0, selectedServices.length - 1);
    }

    // Ensure we always have at least one service
    if (selectedServices.length === 0) {
      // Add back the default service if none remain
      selectedServices.push(ALL_SERVICES[0]);
      activeServiceIndex = 0;
    }

    // Persist to sessionStorage
    saveSelectedServices(selectedServices);
  }
}

/**
 * Get the currently active service
 */
export function getActiveService() {
  return activeService;
}