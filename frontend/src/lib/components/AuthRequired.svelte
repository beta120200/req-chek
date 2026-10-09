<script>
  import { push } from 'svelte-spa-router';

  let { feature = 'this page' } = $props();
</script>

<div class="mx-auto max-w-md rounded-2xl border border-line bg-paper-raised p-8 text-center">
  <h2 class="text-lg font-bold text-ink">Log in to use {feature}</h2>
  <p class="mt-2 text-sm text-ink-soft">
    Guests can browse the service catalog and requirements. To track your documents and see your readiness,
    sign in with your ReqCheck account.
  </p>
  <div class="mt-5 flex justify-center gap-3">
    <button
      onclick={() => push('/login')}
      class="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
    >
      Log In
    </button>
    <button
      onclick={() => push('/register')}
      class="rounded-lg border border-line-strong px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft"
    >
      Create Account
    </button>
  </div>
</div>
