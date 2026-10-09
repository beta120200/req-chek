// ============================================================
// Single place that talks to the Express API.
//
// - Base URL comes from VITE_API_BASE_URL (no Vite proxy).
// - The Supabase access token (issued by POST /api/auth/login) is kept in
//   localStorage and sent as "Authorization: Bearer <token>" on every call.
// - On a 401 the client tries POST /api/auth/refresh once, then retries.
// ============================================================
import { guestContextHeader } from '../state/guestState.svelte.js';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
// In production, an empty value means "same origin" (e.g. API behind the same reverse proxy).
export const API_BASE_URL = (RAW_BASE || (import.meta.env.DEV ? 'http://localhost:3000' : '')).replace(/\/+$/, '');

const STORAGE_KEY = 'reqcheck.session';

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, code?: string | null, data?: any }} [info]
   */
  constructor(message, { status = 0, code = null, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// ---------- session storage ----------

/** @returns {{ session: { accessToken: string, refreshToken: string, expiresAt?: number }, user: any } | null} */
export function loadStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.session?.accessToken ? parsed : null;
  } catch {
    return null;
  }
}

export function storeSession(session, user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ session, user }));
  } catch {
    /* storage unavailable (private mode / quota): the session just won't survive a reload */
  }
}

export function clearStoredSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** @type {() => void} */
let onAuthLost = () => { };
/** Called when the stored session can no longer be used (refresh failed). */
export function setAuthLostHandler(fn) {
  onAuthLost = fn;
}

// ---------- refresh ----------

/** @type {Promise<boolean> | null} */
let refreshing = null;

async function refreshSession() {
  const stored = loadStoredSession();
  if (!stored?.session?.refreshToken) return false;

  // Several requests can hit a 401 at once; share a single refresh call.
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: stored.session.refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        storeSession(data.session, data.user);
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

// ---------- core request ----------

async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) };
  }
}

/**
 * @param {string} path  e.g. "/api/documents"
 * @param {{ method?: string, body?: any, formData?: FormData, auth?: boolean }} [options]
 * @param {boolean} [canRetry]
 */
async function request(path, { method = 'GET', body, formData, auth = true } = {}, canRetry = true) {
  const headers = {};
  const stored = auth ? loadStoredSession() : null;
  if (stored) headers.Authorization = `Bearer ${stored.session.accessToken}`;
  else if (auth) headers['X-Guest-Context'] = guestContextHeader();

  /** @type {BodyInit | undefined} */
  let payload;
  if (formData) {
    payload = formData; // the browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', { code: 'network' });
  }

  if (res.status === 401 && stored && canRetry) {
    if (await refreshSession()) return request(path, { method, body, formData, auth }, false);
    clearStoredSession();
    onAuthLost();
  }

  const data = await parseBody(res);
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, {
      status: res.status,
      code: data?.code ?? null,
      data,
    });
  }
  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  upload: (path, formData, options) => request(path, { ...options, method: 'POST', formData }),
};
