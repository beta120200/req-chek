<script>
  import { service, DOCUMENT_LIBRARY } from '../lib/data/serviceData.js';
  import { documents } from '../lib/state/appState.svelte.js';
  import { documentStatus } from '../lib/data/readiness.js';
  import StatusPill from '../lib/components/StatusPill.svelte';

  let search = $state('');
  let statusFilter = $state('all');

  function statusOf(entry) {
    if (entry.kind === 'requirement') {
      const anyValid = service[0].requirement.options.some(
        (o) => documentStatus(documents, o.docId) === 'valid' || documentStatus(documents, o.docId) === 'expiring'
      );
      return anyValid ? 'satisfied' : 'missing';
    }
    const s = documentStatus(documents, entry.docId);
    if (s === 'valid') return 'satisfied';
    if (s === 'expiring') return 'warning';
    if (s === 'expired') return 'missing';
    return 'missing';
  }

  let entries = $derived([
    {
      kind: 'requirement',
      name: service[0].requirement.name,
      source: service[0].requirement.source,
      lastVerified: service[0].requirement.lastVerified,
      note: service[0].requirement.why,
    },
    ...Object.values(DOCUMENT_LIBRARY).map((d) => ({
      kind: 'document',
      docId: d.id,
      name: d.name,
      source: d.source,
      lastVerified: d.lastVerified,
      note: d.expirable ? 'This document type can expire.' : 'This document type does not expire.',
    })),
  ]);

  let filtered = $derived(
    entries.filter((entry) => {
      const matchesSearch = entry.name.toLowerCase().includes(search.toLowerCase());
      const st = statusOf(entry);
      const matchesStatus = statusFilter === 'all' || st === statusFilter;
      return matchesSearch && matchesStatus;
    })
  );

  const statusLabel = { satisfied: 'Satisfied', warning: 'Expiring', missing: 'Missing' };
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-xl font-bold text-ink">Requirements Directory</h2>
    <p class="text-ink-soft">Browse every requirement ReqCheck tracks for {service[0].name}, and where it comes from.</p>
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
    <select bind:value={statusFilter} class="rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none">
      <option value="all">All statuses</option>
      <option value="satisfied">Satisfied</option>
      <option value="warning">Expiring</option>
      <option value="missing">Missing</option>
    </select>
  </div>

  <div class="rounded-2xl border border-line bg-paper-raised">
    {#each filtered as entry, i}
      <div class="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between {i !== 0 ? 'border-t border-line' : ''}">
        <div>
          <p class="font-semibold text-ink">{entry.name}</p>
          <p class="mt-0.5 text-sm text-ink-soft">{entry.note}</p>
          <p class="mt-1 text-xs text-ink-faint">Source: {entry.source} &middot; Last verified: {entry.lastVerified}</p>
        </div>
        <StatusPill status={statusOf(entry)}>{statusLabel[statusOf(entry)]}</StatusPill>
      </div>
    {:else}
      <p class="p-6 text-center text-sm text-ink-faint">No requirements match your search.</p>
    {/each}
  </div>
</div>
