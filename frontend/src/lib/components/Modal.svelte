<script>
  import { fade, scale } from 'svelte/transition';

  let { title, onClose, size = 'md', children, footer } = $props();

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

  function onBackdropClick(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') onClose?.();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
  onclick={onBackdropClick}
  transition:fade={{ duration: 150 }}
>
  <div
    class="w-full {sizes[size] ?? sizes.md} rounded-2xl bg-paper-raised p-6 shadow-2xl"
    transition:scale={{ duration: 150, start: 0.96 }}
  >
    <div class="flex items-start justify-between gap-4">
      <h3 class="text-lg font-bold text-ink">{title}</h3>
      <button
        onclick={onClose}
        aria-label="Close"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-brand-soft hover:text-brand"
      >
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="mt-4">
      {@render children?.()}
    </div>

    {#if footer}
      <div class="mt-6 flex justify-end gap-3">
        {@render footer?.()}
      </div>
    {/if}
  </div>
</div>
