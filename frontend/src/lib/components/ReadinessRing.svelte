<script>
  // A simple SVG progress ring. `percent` is 0-100.
  let { percent = 0, size = 160, satisfied = false, label = '', sublabel = '' } = $props();

  const stroke = 12;
  const radius = $derived((size - stroke) / 2);
  const circumference = $derived(2 * Math.PI * radius);
  const offset = $derived(circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference);

  const ringColor = $derived(satisfied ? 'var(--color-good)' : percent >= 50 ? 'var(--color-accent)' : 'var(--color-bad)');
</script>

<div class="relative inline-flex items-center justify-center" style="width:{size}px;height:{size}px">
  <svg viewBox="0 0 {size} {size}" width={size} height={size} class="-rotate-90">
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke="var(--color-line)"
      stroke-width={stroke}
    />
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke={ringColor}
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-dasharray={circumference}
      stroke-dashoffset={offset}
      style="transition: stroke-dashoffset 0.4s ease, stroke 0.4s ease;"
    />
  </svg>
  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
    <strong class="text-2xl font-extrabold text-ink leading-none">{label}</strong>
    {#if sublabel}
      <span class="mt-1 text-xs font-medium text-ink-soft">{sublabel}</span>
    {/if}
  </div>
</div>
