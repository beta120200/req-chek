<script>
  // A single clickable box in the dependency map.
  let { title, subtitle = '', status = 'neutral', selected = false, onSelect } = $props();

  const ring = {
    satisfied: 'border-good-line bg-good-soft/50',
    warning: 'border-accent bg-accent-soft/50',
    missing: 'border-line bg-paper-raised',
    neutral: 'border-brand-soft-line bg-brand-soft/50',
    'not-needed': 'border-line bg-paper-raised opacity-50',
  };
</script>

<button
  onclick={onSelect}
  class="w-44 rounded-xl border-2 p-3 text-left shadow-sm transition sm:w-48 {ring[status] ?? ring.neutral} {selected ? 'outline outline-2 outline-offset-2 outline-brand' : ''}"
>
  <p class="text-sm font-bold leading-snug text-ink">{title}</p>
  {#if subtitle}
    <p class="mt-0.5 text-xs text-ink-soft">{subtitle}</p>
  {/if}
</button>
