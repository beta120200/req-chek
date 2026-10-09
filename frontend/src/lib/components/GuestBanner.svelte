<script>
  import { push } from 'svelte-spa-router';
  import { authState } from '../state/authState.svelte.js';
  import { uiState, dismissGuestBanner } from '../state/uiState.svelte.js';
</script>

{#if authState.isGuest && !uiState.guestBannerDismissed}
  <div class="flex flex-wrap items-center gap-3 border-b border-brand-soft-line bg-brand-soft px-4 py-2.5 text-sm text-brand-dark md:px-8">
    <svg viewBox="0 0 24 24" width="16" height="16" class="shrink-0"><path d="M12 3.5l7 3.2v5.1c0 4.6-3 8.7-7 9.7-4-1-7-5.1-7-9.7V6.7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
    <span class="font-medium">You're browsing as a guest — your documents stay in this tab and are lost on reload. Create an account to keep them.</span>
    <button
      onclick={() => push('/register')}
      class="ml-auto rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark"
    >
      Create Account
    </button>
    <button
      onclick={dismissGuestBanner}
      aria-label="Dismiss"
      class="flex h-6 w-6 items-center justify-center rounded-full text-brand hover:bg-brand/10"
    >
      <svg viewBox="0 0 24 24" width="13" height="13"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
  </div>
{/if}
