<script>
  import { push } from 'svelte-spa-router';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
  <h1 class="text-3xl font-extrabold text-ink">Page not found</h1>
  <p class="text-ink-soft">The page you're looking for doesn't exist.</p>
  <button onclick={() => push('/')} class="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
    Back to home
  </button>
</div>
