<script>
  import { push } from 'svelte-spa-router';
  import { authState, logout } from '../lib/state/authState.svelte.js';
  import { resetDocuments, hydrateForCurrentUser } from '../lib/state/appState.svelte.js';

  let notifsEnabled = $state(true);

  function handleLogout() {
    logout();
    hydrateForCurrentUser();
    push('/');
  }
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-xl font-bold text-ink">Settings</h2>
    <p class="text-ink-soft">Manage how ReqCheck works for you.</p>
  </div>

  <div class="divide-y divide-line rounded-2xl border border-line bg-paper-raised">
    <div class="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <p class="font-semibold text-ink">Account</p>
          <span class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide {authState.isGuest ? 'bg-brand-soft text-brand' : 'bg-good-soft text-good'}">
            {authState.isGuest ? 'Guest' : 'Member'}
          </span>
        </div>
        <p class="text-sm text-ink-soft">
          {#if authState.isGuest}
            Browsing as a guest — your documents are kept in memory only and will be lost when you close
            this tab.
          {:else}
            Signed in as {authState.name} ({authState.email}) — your documents are saved to this browser
            and reload automatically next time you log in here.
          {/if}
        </p>
      </div>
      {#if authState.isGuest}
        <button onclick={() => push('/register')} class="self-start rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          Create Account
        </button>
      {:else}
        <button onclick={handleLogout} class="self-start rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft">
          Log out
        </button>
      {/if}
    </div>

    <div class="flex items-center justify-between p-5">
      <div>
        <p class="font-semibold text-ink">Notification alerts</p>
        <p class="text-sm text-ink-soft">Get warned before a document expires.</p>
      </div>
      <button
        role="switch"
        aria-checked={notifsEnabled}
        aria-label="Toggle notification alerts"
        onclick={() => (notifsEnabled = !notifsEnabled)}
        class="relative h-7 w-12 shrink-0 rounded-full transition-colors {notifsEnabled ? 'bg-good' : 'bg-line-strong'}"
      >
        <span class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform {notifsEnabled ? 'translate-x-6' : 'translate-x-1'}"></span>
      </button>
    </div>

    <div class="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="font-semibold text-ink">Reset demo data</p>
        <p class="text-sm text-ink-soft">Restore all documents to their original demo state.</p>
      </div>
      <button onclick={resetDocuments} class="self-start rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft">
        Reset
      </button>
    </div>
  </div>
</div>
