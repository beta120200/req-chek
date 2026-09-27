<script>
  import { push } from 'svelte-spa-router';
  import { DOCUMENT_LIBRARY } from '../lib/data/serviceData.js';
  import { documents, saveDocument, removeDocument } from '../lib/state/appState.svelte.js';
  import { documentStatus, daysUntilExpiry } from '../lib/data/readiness.js';
  import StatusPill from '../lib/components/StatusPill.svelte';
  import Modal from '../lib/components/Modal.svelte';

  let search = $state('');
  let filter = $state('all');
  let sort = $state('name');

  const statusPillMap = { valid: 'satisfied', expiring: 'warning', expired: 'missing', 'not-held': 'neutral' };
  const statusLabelMap = { valid: 'Valid', expiring: 'Expiring soon', expired: 'Expired', 'not-held': 'Not held' };

  let rows = $derived(
    Object.values(DOCUMENT_LIBRARY).map((docType) => {
      const record = documents[docType.id];
      const status = documentStatus(documents, docType.id);
      return { ...docType, ...record, status, remaining: daysUntilExpiry(documents, docType.id) };
    })
  );

  let filtered = $derived(
    rows
      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
      .filter((r) => {
        if (filter === 'all') return true;
        if (filter === 'valid') return r.status === 'valid';
        if (filter === 'expiring') return r.status === 'expiring';
        if (filter === 'expired') return r.status === 'expired';
        return true;
      })
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'status') return a.status.localeCompare(b.status);
        if (sort === 'expiry') return (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999');
        return 0;
      })
  );

  // --- Add/Edit modal ---
  let showDocModal = $state(false);
  let editingId = $state(null);
  let formIssueDate = $state('');
  let formExpiryDate = $state('');
  let formNotes = $state('');

  function openAddModal() {
    const firstNotHeld = Object.values(DOCUMENT_LIBRARY).find((d) => !documents[d.id].held);
    editingId = firstNotHeld?.id ?? Object.values(DOCUMENT_LIBRARY)[0].id;
    formIssueDate = '';
    formExpiryDate = '';
    formNotes = '';
    showDocModal = true;
  }

  function openEditModal(docId) {
    editingId = docId;
    const record = documents[docId];
    formIssueDate = record.issueDate ?? '';
    formExpiryDate = record.expiryDate ?? '';
    formNotes = record.notes ?? '';
    showDocModal = true;
  }

  function submitDocForm(e) {
    e.preventDefault();
    saveDocument(editingId, {
      issueDate: formIssueDate || null,
      expiryDate: formExpiryDate || null,
      notes: formNotes,
    });
    showDocModal = false;
  }

  // --- Confirm delete modal ---
  let pendingDeleteId = $state(null);

  function confirmRemove() {
    removeDocument(pendingDeleteId);
    pendingDeleteId = null;
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="text-xl font-bold text-ink">My Documents</h2>
      <p class="text-ink-soft">Records of documents you hold — ReqCheck never stores the files themselves.</p>
    </div>
    <div class="flex gap-2">
      <button
        onclick={() => push('/app/id-check')}
        class="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft"
      >
        Verify an ID
      </button>
      <button
        onclick={openAddModal}
        class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
      >
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
        Add Document
      </button>
    </div>
  </div>

  <div class="flex flex-col gap-3 sm:flex-row">
    <div class="relative flex-1">
      <svg viewBox="0 0 24 24" width="16" height="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <input
        type="text"
        bind:value={search}
        placeholder="Search your documents…"
        class="w-full rounded-lg border border-line-strong py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
      />
    </div>
    <select bind:value={filter} class="rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none">
      <option value="all">All statuses</option>
      <option value="valid">Valid</option>
      <option value="expiring">Expiring soon</option>
      <option value="expired">Expired</option>
    </select>
    <select bind:value={sort} class="rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none">
      <option value="name">Sort: Name</option>
      <option value="expiry">Sort: Expiry date</option>
      <option value="status">Sort: Status</option>
    </select>
  </div>

  <div class="rounded-2xl border border-line bg-paper-raised">
    {#each filtered as doc, i}
      <div class="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between {i !== 0 ? 'border-t border-line' : ''}">
        <div>
          <p class="font-semibold text-ink">{doc.name}</p>
          <p class="text-sm text-ink-soft">Source: {doc.source}</p>
          {#if doc.held && doc.expirable}
            <p class="text-xs text-ink-faint">
              {doc.expiryDate
                ? `Expires ${doc.expiryDate}${doc.remaining !== null && doc.remaining >= 0 ? ` (${doc.remaining} day${doc.remaining === 1 ? '' : 's'})` : ''}`
                : 'No expiration date on file'}
            </p>
          {/if}
          {#if doc.notes}
            <p class="mt-0.5 text-xs italic text-ink-faint">{doc.notes}</p>
          {/if}
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <StatusPill status={statusPillMap[doc.status]}>{statusLabelMap[doc.status]}</StatusPill>
          {#if doc.held}
            <button
              onclick={() => openEditModal(doc.id)}
              aria-label="Edit {doc.name}"
              class="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-brand-soft hover:text-brand"
            >
              <svg viewBox="0 0 24 24" width="15" height="15"><path d="M4 20h4l10.5-10.5a2 2 0 0 0-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
            </button>
            <button
              onclick={() => (pendingDeleteId = doc.id)}
              aria-label="Remove {doc.name}"
              class="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-bad-soft hover:text-bad"
            >
              <svg viewBox="0 0 24 24" width="15" height="15"><path d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          {:else}
            <button
              onclick={() => openEditModal(doc.id)}
              class="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:bg-brand-soft"
            >
              Add details
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <p class="p-6 text-center text-sm text-ink-faint">No documents match your search.</p>
    {/each}
  </div>
</div>

{#if showDocModal}
  <Modal title={documents[editingId].held ? `Edit ${DOCUMENT_LIBRARY[editingId].name}` : `Add ${DOCUMENT_LIBRARY[editingId].name}`} onClose={() => (showDocModal = false)}>
    {#snippet children()}
      <form id="doc-form" class="space-y-4" onsubmit={submitDocForm}>
        <label class="block">
          <span class="text-sm font-medium text-ink">Document type</span>
          <select
            bind:value={editingId}
            class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            {#each Object.values(DOCUMENT_LIBRARY) as d}
              <option value={d.id}>{d.name}</option>
            {/each}
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium text-ink">Issue date</span>
          <input type="date" bind:value={formIssueDate} class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
        </label>
        {#if DOCUMENT_LIBRARY[editingId].expirable}
          <label class="block">
            <span class="text-sm font-medium text-ink">Expiration date</span>
            <input type="date" bind:value={formExpiryDate} class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
            <small class="text-xs text-ink-faint">Leave blank if you're not sure yet.</small>
          </label>
        {/if}
        <label class="block">
          <span class="text-sm font-medium text-ink">Notes</span>
          <textarea bind:value={formNotes} rows="2" placeholder="Optional notes" class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"></textarea>
        </label>
      </form>
    {/snippet}
    {#snippet footer()}
      <button onclick={() => (showDocModal = false)} class="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft">
        Cancel
      </button>
      <button type="submit" form="doc-form" class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
        {documents[editingId].held ? 'Save Changes' : 'Add Document'}
      </button>
    {/snippet}
  </Modal>
{/if}

{#if pendingDeleteId}
  <Modal title="Remove document?" size="sm" onClose={() => (pendingDeleteId = null)}>
    {#snippet children()}
      <p class="text-sm text-ink-soft">
        This will remove {DOCUMENT_LIBRARY[pendingDeleteId].name} from your inventory. ReqCheck never stored
        a file for it, so this just clears the record.
      </p>
    {/snippet}
    {#snippet footer()}
      <button onclick={() => (pendingDeleteId = null)} class="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft">
        Cancel
      </button>
      <button onclick={confirmRemove} class="rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
        Remove
      </button>
    {/snippet}
  </Modal>
{/if}
