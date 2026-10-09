<script>
  import { createResource } from '../lib/api/resource.svelte.js';
  import { authState } from '../lib/state/authState.svelte.js';
  import StatusPill from '../lib/components/StatusPill.svelte';

  // Public data: guests see everything (without status); members see their active service.
  const directory = createResource('/api/requirements-directory', { requireAuth: false });

  let search = $state('');
  let statusFilter = $state('all');

  let entries = $derived(directory.data ?? []);
  let hasStatus = $derived(entries.some((e) => e.status));

  let filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((entry) => entry.name.toLowerCase().includes(q))
      .filter((entry) => statusFilter === 'all' || entry.status === statusFilter);
  });

  const statusLabel = {
    satisfied: 'Satisfied',
    warning: 'Expiring',
    missing: 'Missing',
  };
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-xl font-bold text-ink">Requirements Directory</h2>
    <p class="text-ink-soft">Browse the requirements and documents ReqCheck tracks, and where each one comes from.</p>
  </div>

  <div class="flex flex-col gap-3 sm:flex-row">
    <div class="relative flex-1">
      <svg viewBox="0 0 24 24" width="16" height="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <input
        type="text"
        bind:value={search}
        placeholder="Search requirements…"
        class="w-full rounded-lg border border-line-strong py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
      />
    </div>
    {#if hasStatus}
      <select bind:value={statusFilter} class="rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none">
        <option value="all">All statuses</option>
        <option value="satisfied">Satisfied</option>
        <option value="warning">Expiring</option>
        <option value="missing">Missing</option>
      </select>
    {/if}
  </div>

  <div class="rounded-2xl border border-line bg-paper-raised">
    {#if directory.loading}
      <div class="text-center py-8">
        <p class="text-sm text-ink-soft">Loading requirements directory...</p>
      </div>
    {:else if directory.error}
      <div class="text-center py-8">
        <p class="text-sm text-bad">{directory.error}</p>
      </div>
    {:else if entries.length === 0}
      <p class="p-6 text-center text-sm text-ink-faint">No requirements found.</p>
    {:else if filtered.length === 0}
      <p class="p-6 text-center text-sm text-ink-faint">Nothing matches your search.</p>
    {:else}
      {#each filtered as entry, i (`${entry.kind}:${entry.docId ?? entry.name}`)}
        <div class="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between {i !== 0 ? 'border-t border-line' : ''}">
          <div>
            <p class="font-semibold text-ink">{entry.name}</p>
            {#if entry.note}
              <p class="mt-0.5 text-sm text-ink-soft">{entry.note}</p>
            {/if}
            {#if entry.source || entry.lastVerified}
              <p class="mt-1 text-xs text-ink-faint">
                {#if entry.source}Source: {entry.source}{/if}
                {#if entry.source && entry.lastVerified} &middot; {/if}
                {#if entry.lastVerified}Last verified: {entry.lastVerified}{/if}
              </p>
            {/if}
          </div>
          {#if entry.status}
            <StatusPill status={entry.status}>{statusLabel[entry.status]}</StatusPill>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>