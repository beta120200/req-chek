<script>
  import { push } from 'svelte-spa-router';
  import AuthLayout from '../lib/components/AuthLayout.svelte';
  import { register, continueAsGuest, authState } from '../lib/state/authState.svelte.js';
  import { hydrateForCurrentUser } from '../lib/state/appState.svelte.js';
  import { showToast } from '../lib/state/toastState.svelte.js';
  
  let fname = $state('');
  let lname = $state('');
  let name = $derived(`${fname} ${lname}`);
  let email = $state('');
  let password = $state('');
  let confirm = $state('');
  let error = $state('');

  function submit(e) {
    e.preventDefault();
    error = '';
    if (!name || !email || !password) {
      error = 'Please fill in every field.';
      return;
    }
    if (password.length < 6) {
      error = 'Password must be at least 6 characters.';
      return;
    }
    if (password !== confirm) {
      error = 'Passwords do not match.';
      return;
    }
    const result = register(name, email, password);
    if (!result.ok) {
      error = result.error;
      return;
    }
    hydrateForCurrentUser();
    showToast(`Account created — welcome, ${authState.name}.`);
    push('/app');
  }

  function guest() {
    continueAsGuest();
    hydrateForCurrentUser();
    push('/app');
  }
</script>

<AuthLayout title="Create Account" subtitle="Save your document inventory and readiness progress to this browser.">
  {#snippet children()}
    <p class="mb-4 flex items-start gap-2 rounded-lg bg-brand-soft/60 p-3 text-xs text-ink-soft">
      <svg viewBox="0 0 24 24" width="15" height="15" class="mt-0.5 shrink-0 text-brand"><path d="M12 3.5l7 3.2v5.1c0 4.6-3 8.7-7 9.7-4-1-7-5.1-7-9.7V6.7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      This is a prototype — accounts live only in this browser's storage, and ReqCheck never asks for or
      stores your actual government ID, scans, or files.
    </p>

    {#if error}
      <p class="mb-4 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>
    {/if}

    <form class="space-y-4" onsubmit={submit}>
      <div class="flex gap-4">
      <label class="block">
        <span class="text-sm font-medium text-ink">First name</span>
        <input
          type="text"
          bind:value={fname}
          placeholder="Juan"
          class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </label>
      <label class="block">
        <span class="text-sm font-medium text-ink">Last name</span>
        <input
          type="text"
          bind:value={lname}
          placeholder="Dela Cruz"
          class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </label>
    </div>
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
          placeholder="At least 6 characters"
          class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </label>
      <label class="block">
        <span class="text-sm font-medium text-ink">Confirm password</span>
        <input
          type="password"
          bind:value={confirm}
          placeholder="Re-enter your password"
          class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </label>
      <button type="submit" class="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark">
        Create Account
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
      Already have an account?
      <button onclick={() => push('/login')} class="font-semibold text-brand hover:underline">Log in</button>
    </p>
  {/snippet}
</AuthLayout>
