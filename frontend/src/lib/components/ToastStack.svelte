<script>
  import { fly } from 'svelte/transition';
  import { toastState, dismissToast } from '../state/toastState.svelte.js';
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
  {#each toastState.items as toast (toast.id)}
    <div
      transition:fly={{ y: 16, duration: 200 }}
      class="pointer-events-auto flex items-center gap-3 rounded-lg bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg"
    >
      <span>{toast.message}</span>
      <button
        aria-label="Dismiss"
        onclick={() => dismissToast(toast.id)}
        class="text-white/60 hover:text-white"
      >
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
  {/each}
</div>
