<script>
  import { notificationState, clearAllNotifications } from '../lib/state/notificationState.svelte.js';
  import Modal from '../lib/components/Modal.svelte';

  let activeDetail = $state(null);

  const typeStyles = {
    expiring: 'border-warn-line bg-warn-soft/40',
    'requirement-change': 'border-brand-soft-line bg-brand-soft/40',
    info: 'border-line bg-paper',
  };

  const typeLabels = {
    expiring: 'Expiration warning',
    'requirement-change': 'Requirement change',
    info: 'Info',
  };

  function openIfChange(n) {
    if (n.type === 'requirement-change') activeDetail = n.detail;
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="text-xl font-bold text-ink">Notifications</h2>
      <p class="text-ink-soft">Expiration alerts, requirement changes, and readiness updates.</p>
    </div>
    <button
      onclick={clearAllNotifications}
      class="self-start rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft"
    >
      Clear all
    </button>
  </div>

  {#if notificationState.items.length === 0}
    <div class="rounded-2xl border border-dashed border-line-strong bg-paper-raised/60 p-10 text-center text-sm text-ink-faint">
      You're all caught up — no notifications right now.
    </div>
  {:else}
    <div class="space-y-3">
      {#each notificationState.items as n}
        <button
          onclick={() => openIfChange(n)}
          class="w-full rounded-xl border p-4 text-left {typeStyles[n.type] ?? typeStyles.info} {n.type === 'requirement-change' ? 'cursor-pointer hover:brightness-95' : 'cursor-default'}"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs font-semibold uppercase tracking-wide text-ink-faint">{typeLabels[n.type]}</span>
            <span class="text-xs text-ink-faint">{n.date}</span>
          </div>
          <p class="mt-1 font-semibold text-ink">{n.title}</p>
          <p class="mt-1 text-sm text-ink-soft">{n.message}</p>
          {#if n.type === 'requirement-change'}
            <p class="mt-2 text-xs font-semibold text-brand">View details &rarr;</p>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

{#if activeDetail}
  <Modal title="Requirement Updated" onClose={() => (activeDetail = null)}>
    {#snippet children()}
      <p class="text-sm text-ink-soft">A requirement source ReqCheck tracks has changed.</p>
      <div class="mt-4 space-y-2 rounded-lg bg-paper p-4 text-sm">
        <p><span class="font-semibold text-ink">Requirement:</span> {activeDetail.title}</p>
        <p><span class="font-semibold text-ink">Previously:</span> {activeDetail.from}</p>
        <p><span class="font-semibold text-ink">Now:</span> {activeDetail.to}</p>
        <p class="text-ink-faint">Source: {activeDetail.source} &middot; Last verified: {activeDetail.lastVerified}</p>
      </div>
    {/snippet}
    {#snippet footer()}
      <button
        onclick={() => (activeDetail = null)}
        class="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Got it
      </button>
    {/snippet}
  </Modal>
{/if}
