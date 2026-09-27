<script>
  import { push } from 'svelte-spa-router';

  let { title, subtitle = '', children } = $props();
</script>

<div class="min-h-screen bg-paper">
  <header class="border-b border-line bg-paper-raised">
    <div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-6">
      <button onclick={() => push('/')} class="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
        <span class="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-white">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 12.5 9.5 18 20 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        ReqCheck
      </button>
      <button onclick={() => push('/')} class="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:text-brand">
        Back to home
      </button>
    </div>
  </header>

  <main class="mx-auto flex max-w-md flex-col px-6 py-14">
    <div class="rounded-2xl border border-line bg-paper-raised p-6 shadow-sm">
      <h2 class="text-xl font-bold text-ink">{title}</h2>
      {#if subtitle}
        <p class="mt-1 text-sm text-ink-soft">{subtitle}</p>
      {/if}
      <div class="mt-5">
        {@render children?.()}
      </div>
    </div>
  </main>
</div>
