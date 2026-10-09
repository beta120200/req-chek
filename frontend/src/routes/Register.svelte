<script>
  import { push } from 'svelte-spa-router';
  import AuthLayout from '../lib/components/AuthLayout.svelte';
  import { register, continueAsGuest, authState } from '../lib/state/authState.svelte.js';
  import { showToast } from '../lib/state/toastState.svelte.js';

  let fname = $state('');
  let lname = $state('');
  let name = $derived(`${fname} ${lname}`.trim());
  let email = $state('');
  let password = $state('');
  let confirm = $state('');
  let error = $state('');
  let info = $state('');
  let submitting = $state(false);

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    error = '';
    info = '';
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
    submitting = true;
    const result = await register(name, email, password);
    submitting = false;
    if (!result.ok) {
      error = result.error ?? 'Registration failed.';
      return;
    }
    if (result.needsEmailConfirmation) {
      // Supabase is set to confirm emails first: there is no session yet.
      info = `We sent a confirmation link to ${email}. Open it, then log in.`;
      return;
    }
    showToast(`Account created — welcome, ${authState.name}.`);
    push('/app');
  }

  function guest() {
    continueAsGuest();
    push('/app');
  }
</script>

<AuthLayout title="Create Account" subtitle="Save your document inventory and readiness progress to your account.">
  {#snippet children()}
    
    {#if error}
      <p class="mb-4 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>
    {/if}
    {#if info}
      <p class="mb-4 rounded-lg bg-good-soft px-3 py-2 text-sm text-good">
        {info}
        <button type="button" onclick={() => push('/login')} class="ml-1 font-semibold underline">Go to log in</button>
      </p>
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
          autocomplete="new-password"
          bind:value={password}
          placeholder="At least 6 characters"
          class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </label>
      <label class="block">
        <span class="text-sm font-medium text-ink">Confirm password</span>
        <input
          type="password"
          autocomplete="new-password"
          bind:value={confirm}
          placeholder="Re-enter your password"
          class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        class="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Creating account…' : 'Create Account'}
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
