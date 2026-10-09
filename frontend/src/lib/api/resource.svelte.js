import { untrack } from 'svelte';
import { api } from './client.js';
import { authState } from '../state/authState.svelte.js';

/** Bump after any document/service change so open pages re-fetch. */
export const dataVersion = $state({ n: 0 });

/**
 * @param {string} path
 * @param {{ requireAuth?: boolean }} [options]  requireAuth defaults to false: guests are allowed everywhere
 */
export function createResource(path, { requireAuth = false } = {}) {
  const r = $state({
    /** @type {any} */ data: null,
    loading: true,
    /** @type {string | null} */ error: null,
    /** @type {string | null} */ code: null,
    needsLogin: false,
  });

  async function load() {
    if (!r.data) r.loading = true; // keep showing old data while refreshing
    r.error = null;
    r.code = null;
    try {
      r.data = await api.get(path);
    } catch (err) {
      r.data = null;
      r.error = err instanceof Error ? err.message : 'Something went wrong.';
      r.code = /** @type {any} */ (err)?.code ?? null;
    } finally {
      r.loading = false;
    }
  }

  $effect(() => {
    void dataVersion.n;
    const isGuest = authState.isGuest;
    if (!authState.ready) return;
    if (requireAuth && isGuest) {
      r.data = null;
      r.loading = false;
      r.needsLogin = true;
      return;
    }
    r.needsLogin = false;
    untrack(load);
  });

  return {
    get data() { return r.data; },
    get loading() { return r.loading; },
    get error() { return r.error; },
    get code() { return r.code; },
    get needsLogin() { return r.needsLogin; },
    reload: load,
  };
}