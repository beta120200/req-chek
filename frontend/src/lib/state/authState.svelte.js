// ============================================================
// Mock authentication — no backend.
//
// "Member" accounts are real in the sense that they're validated
// against records kept in this browser's localStorage (email +
// password), and a member's document inventory is persisted there
// too (see appState.svelte.js). "Guest" mode skips all of that —
// it's the same app, but nothing survives a reload.
//
// This is a prototype: passwords are stored in plain text in
// localStorage purely to simulate "an account exists". Never do
// this in a real product.
// ============================================================

const ACCOUNTS_KEY = 'reqcheck:accounts';
const SESSION_KEY = 'reqcheck:session';

function hasStorage() {
  return typeof localStorage !== 'undefined';
}

function loadAccounts() {
  if (!hasStorage()) return {};
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveAccounts(accounts) {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* storage unavailable (private browsing, quota, etc.) — fail silently */
  }
}

function loadSession() {
  if (!hasStorage()) return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveSession(session) {
  if (!hasStorage()) return;
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

const restoredSession = loadSession();

/**
 * isGuest: true  -> browsing without an account, nothing persists
 * isGuest: false -> a "member" session backed by a localStorage account
 */
export const authState = $state({
  isGuest: !restoredSession,
  name: restoredSession?.name ?? 'Guest User',
  email: restoredSession?.email ?? null,
});

export function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function continueAsGuest() {
  authState.isGuest = true;
  authState.name = 'Guest User';
  authState.email = null;
  saveSession(null);
}

/** @returns {{ ok: true } | { ok: false, error: string }} */
export function register(name, email, password) {
  const key = email.trim().toLowerCase();
  const accounts = loadAccounts();

  if (accounts[key]) {
    return { ok: false, error: 'An account with that email already exists — try logging in instead.' };
  }

  accounts[key] = { name, password };
  saveAccounts(accounts);

  authState.isGuest = false;
  authState.name = name;
  authState.email = key;
  saveSession({ name, email: key });

  return { ok: true };
}

/** @returns {{ ok: true } | { ok: false, error: string }} */
export function login(email, password) {
  const key = email.trim().toLowerCase();
  const accounts = loadAccounts();
  const account = accounts[key];

  if (!account) {
    return { ok: false, error: 'No account found with that email. Try creating one instead.' };
  }
  if (account.password !== password) {
    return { ok: false, error: 'Incorrect password.' };
  }

  authState.isGuest = false;
  authState.name = account.name;
  authState.email = key;
  saveSession({ name: account.name, email: key });

  return { ok: true };
}

export function logout() {
  continueAsGuest();
}
