<script>
  import { push } from 'svelte-spa-router';
  import logo from '../../assets/logo.svg';

  let { title, subtitle = '', children } = $props();
</script>

<div class="min-h-screen bg-paper">
  <header class="border-b border-line bg-paper-raised">
    <div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-6">
      <button onclick={() => push('/')} class="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
        <span class="flex h-7 w-7 items-center justify-center">
          <img src={logo} alt="ReqCheck Logo" />
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
