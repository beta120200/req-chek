<script>
  import { push } from 'svelte-spa-router';
  import { authState, logout } from '../lib/state/authState.svelte.js';
  import { resetDocuments } from '../lib/state/appState.svelte.js';

  let notifsEnabled = $state(true);

  let confirmingClear = $state(false);

  async function handleLogout() {
    await logout();
    push('/');
  }

  async function clearDocuments() {
    await resetDocuments();
    confirmingClear = false;
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
            You're browsing as a guest. Create an account or log in to save your documents.
          {:else}
            Signed in as {authState.email}. Your documents are saved to your account.
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
        <span class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform {notifsEnabled ? 'translate-x-1' : 'translate-x-[-23px]'}"></span>
      </button>
    </div>

      <div class="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-semibold text-ink">Clear my documents</p>
          <p class="text-sm text-ink-soft">Remove every document record from your account.</p>
        </div>
        {#if confirmingClear}
          <div class="flex gap-2 self-start">
            <button onclick={clearDocuments} class="rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Yes, clear all</button>
            <button onclick={() => (confirmingClear = false)} class="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft">Cancel</button>
          </div>
        {:else}
          <button onclick={() => (confirmingClear = true)} class="self-start rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft">
            Clear
          </button>
        {/if}
      </div>
  </div>
</div>
