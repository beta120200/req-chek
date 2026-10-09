<script>
  import { push } from 'svelte-spa-router';
  import AuthLayout from '../lib/components/AuthLayout.svelte';
  import { login, continueAsGuest, authState } from '../lib/state/authState.svelte.js';
  import { showToast } from '../lib/state/toastState.svelte.js';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let submitting = $state(false);

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    error = '';
    if (!email || !password) {
      error = 'Enter both an email and a password.';
      return;
    }
    submitting = true;
    const result = await login(email, password);
    submitting = false;
    if (!result.ok) {
      error = result.error ?? 'Login failed.';
      return;
    }
    showToast(`Welcome back, ${authState.name}.`);
    push('/app');
  }

  function guest() {
    continueAsGuest();
    push('/app');
  }
</script>

<AuthLayout title="Log In" subtitle="Log in to see and save your document inventory.">
  {#snippet children()}

    {#if error}
      <p class="mb-4 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>
    {/if}

    <form class="space-y-4" onsubmit={submit}>
      <label class="block">
        <span class="text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          autocomplete="email"
          bind:value={email}
          placeholder="you@example.com"
          class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </label>
      <label class="block">
        <span class="text-sm font-medium text-ink">Password</span>
        <input
          type="password"
          autocomplete="current-password"
          bind:value={password}
          placeholder="••••••••"
          class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        class="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Logging in…' : 'Log In'}
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
