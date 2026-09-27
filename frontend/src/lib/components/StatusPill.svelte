<script>
  // status: 'satisfied' | 'warning' | 'missing' | 'neutral'
  let { status = 'neutral', children } = $props();

  const styles = {
    satisfied: 'bg-good-soft text-good border-good-line',
    warning: 'bg-warn-soft text-warn border-warn-line',
    missing: 'bg-bad-soft text-bad border-bad-line',
    neutral: 'bg-brand-soft text-brand border-brand-soft-line',
  };
</script>

<span
  class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold {styles[status] ?? styles.neutral}"
>
  {@render children?.()}
</span>
