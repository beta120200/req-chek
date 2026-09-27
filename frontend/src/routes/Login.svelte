<script>
  import { push } from 'svelte-spa-router';
  import AuthLayout from '../lib/components/AuthLayout.svelte';
  import { login, continueAsGuest, authState } from '../lib/state/authState.svelte.js';
  import { hydrateForCurrentUser } from '../lib/state/appState.svelte.js';
  import { showToast } from '../lib/state/toastState.svelte.js';

  let email = $state('');
  let password = $state('');
  let error = $state('');

  function submit(e) {
    e.preventDefault();
    error = '';
    if (!email || !password) {
      error = 'Enter both an email and a password.';
      return;
    }
    const result = login(email, password);
    if (!result.ok) {
      error = result.error;
      return;
    }
    hydrateForCurrentUser();
    showToast(`Welcome back, ${authState.name}.`);
    push('/app');
  }

  function guest() {
    continueAsGuest();
    hydrateForCurrentUser();
    push('/app');
  }
</script>

<AuthLayout title="Log In" subtitle="Member accounts save your document inventory to this browser.">
  {#snippet children()}
    <p class="mb-4 flex items-start gap-2 rounded-lg bg-brand-soft/60 p-3 text-xs text-ink-soft">
      <svg viewBox="0 0 24 24" width="15" height="15" class="mt-0.5 shrink-0 text-brand"><path d="M12 3.5l7 3.2v5.1c0 4.6-3 8.7-7 9.7-4-1-7-5.1-7-9.7V6.7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      This is a prototype — accounts and passwords live only in this browser's storage, nothing is sent
      anywhere. Don't reuse a real password.
    </p>

    {#if error}
      <p class="mb-4 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>
    {/if}

    <form class="space-y-4" onsubmit={submit}>
      <label class="block">
        <span class="text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          bind:value={email}
          placeholder="you@example.com"
          class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </label>
      <label class="block">
        <span class="text-sm font-medium text-ink">Password</span>
        <input
          type="password"
          bind:value={password}
          placeholder="••••••••"
          class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </label>
      <button type="submit" class="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark">
        Log In
      </button>
    </form>

    <div class="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
      <span class="h-px flex-1 bg-line"></span>
      or
      <span class="h-px flex-1 bg-line"></span>
    </div>

    <button
      onclick={guest}
      class="w-full rounded-lg border border-line-strong py-3 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft"
    >
      Continue as Guest
    </button>

    <p class="mt-6 text-center text-sm text-ink-soft">
      New to ReqCheck?
      <button onclick={() => push('/register')} class="font-semibold text-brand hover:underline">Create an account</button>
    </p>
  {/snippet}
</AuthLayout>
