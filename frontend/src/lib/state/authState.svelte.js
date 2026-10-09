// ============================================================
// Authentication, backed by Supabase Auth through the Express API.
//
//   register / login  -> POST /api/auth/register | /login
//   session           -> access + refresh token kept in localStorage (see api/client.js)
//   restoreSession    -> GET  /api/auth/me   (on page load)
//   logout            -> POST /api/auth/logout
// ============================================================
import {
  api,
  clearStoredSession,
  loadStoredSession,
  setAuthLostHandler,
  storeSession,
} from '../api/client.js';
import { showToast } from './toastState.svelte.js';

const stored = loadStoredSession();

function displayName(user) {
  return user?.name || user?.email?.split('@')[0] || 'User';
}

/**
 * isGuest: true  -> browsing without an account (public catalog only)
 * isGuest: false -> signed in with Supabase
 * ready:   false only while a stored session is being re-verified on page load
 */
export const authState = $state({
  isGuest: !stored,
  ready: !stored,
  name: stored ? displayName(stored.user) : 'Guest User',
  email: stored?.user?.email ?? null,
});

export function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function applyUser(user) {
  authState.isGuest = false;
  authState.name = displayName(user);
  authState.email = user?.email ?? null;
}

function becomeGuest() {
  authState.isGuest = true;
  authState.name = 'Guest User';
  authState.email = null;
}

export function continueAsGuest() {
  clearStoredSession();
  becomeGuest();
}

// The API client calls this when a token can't be refreshed any more.
setAuthLostHandler(() => {
  if (!authState.isGuest) showToast('Your session expired. Please log in again.');
  becomeGuest();
});

/**
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ ok: boolean, error?: string, needsEmailConfirmation?: boolean }>}
 */
export async function register(name, email, password) {
  try {
    const data = await api.post(
      '/api/auth/register',
      { name: name.trim(), email: email.trim(), password },
      { auth: false },
    );

    if (data.session) {
      storeSession(data.session, data.user);
      applyUser(data.user);
      return { ok: true, needsEmailConfirmation: false };
    }
    // Supabase is set to "Confirm email": no session until the link in the email is clicked.
    return { ok: true, needsEmailConfirmation: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Registration failed' };
  }
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function login(email, password) {
  try {
    const data = await api.post('/api/auth/login', { email: email.trim(), password }, { auth: false });
    storeSession(data.session, data.user);
    applyUser(data.user);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Login failed' };
  }
}

export async function logout() {
  try {
    await api.post('/api/auth/logout', {});
  } catch {
    /* the local session is cleared either way */
  }
  clearStoredSession();
  becomeGuest();
  return { ok: true };
}

/** Re-verifies a stored session on page load. Call once at startup. */
export async function restoreSession() {
  if (!loadStoredSession()) {
    authState.ready = true;
    return;
  }
  try {
    const data = await api.get('/api/auth/me');
    applyUser(data.user);
    const current = loadStoredSession();
    if (current) storeSession(current.session, data.user);
  } catch (err) {
    // A 401 already cleared the session via the auth-lost handler. For a network
    // error keep the session: the server may simply be down for a moment.
    if (err?.status === 401) becomeGuest();
  } finally {
    authState.ready = true;
  }
}
