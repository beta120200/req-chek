<script>
  import { push } from 'svelte-spa-router';
  import { authState } from '../lib/state/authState.svelte.js';
  import {
    documentLibrary,
    documents,
    documentsStatus,
    loadDocuments,
    saveDocument,
    removeDocument,
  } from '../lib/state/appState.svelte.js';
  import StatusPill from '../lib/components/StatusPill.svelte';
  import Modal from '../lib/components/Modal.svelte';
  import Edit from '../assets/pencil.svg';
  import Trash from '../assets/trash.svg';

  // UI state
  let search = $state('');
  let filter = $state('all');
  let sort = $state('name');

  const statusPillMap = { valid: 'satisfied', expiring: 'warning', expired: 'missing', 'not-held': 'neutral' };
  const statusLabelMap = { valid: 'Valid', expiring: 'Expiring soon', expired: 'Expired', 'not-held': 'Not held' };

  // Refresh from the API whenever the page opens for a signed-in user (App also loads on login).
  $effect(() => {
    if (authState.ready) loadDocuments();
  });

  let rows = $derived(
    Object.values(documentLibrary).map((docType) => {
      const record = documents[docType.id];
      return {
        ...docType,
        held: record?.held ?? false,
        issueDate: record?.issueDate ?? null,
        expiryDate: record?.expiryDate ?? null,
        notes: record?.notes ?? '',
        status: record?.held ? record.status : 'not-held',
        remaining: record?.remaining ?? null,
      };
    }),
  );

  let filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => r.name.toLowerCase().includes(q))
      .filter((r) => filter === 'all' || r.status === filter)
      .sort((a, b) => {
        if (sort === 'expiry') {
          const A = a.expiryDate ? Date.parse(a.expiryDate) : Infinity;
          const B = b.expiryDate ? Date.parse(b.expiryDate) : Infinity;
          return A === B ? a.name.localeCompare(b.name) : A < B ? -1 : 1;
        }
        if (sort === 'status') return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
        return a.name.localeCompare(b.name);
      });
  });

  // --- Add/Edit modal ---
  let showDocModal = $state(false);
  /** @type {string | null} */
  let editingId = $state(null);
  let formIssueDate = $state('');
  let formExpiryDate = $state('');
  let formNotes = $state('');
  let formError = $state('');
  let saving = $state(false);

  let editingDoc = $derived(editingId ? documentLibrary[editingId] : null);
  let editingHeld = $derived(editingId ? !!documents[editingId]?.held : false);

  function fillForm(docId) {
    const record = documents[docId];
    formIssueDate = record?.issueDate ?? '';
    formExpiryDate = record?.expiryDate ?? '';
    formNotes = record?.notes ?? '';
    formError = '';
  }

  function openAddModal() {
    const all = Object.values(documentLibrary);
    if (all.length === 0) return;
    const firstNotHeld = all.find((d) => !documents[d.id]?.held);
    editingId = (firstNotHeld ?? all[0]).id;
    fillForm(editingId);
    showDocModal = true;
  }

  /** @param {string} docId */
  function openEditModal(docId) {
    editingId = docId;
    fillForm(docId);
    showDocModal = true;
  }

  /** @param {Event} e */
  async function submitDocForm(e) {
    e.preventDefault();
    if (!editingId || saving) return;
    saving = true;
    formError = '';
    const result = await saveDocument(editingId, {
      issueDate: formIssueDate || null,
      expiryDate: editingDoc?.expirable ? formExpiryDate || null : null,
      notes: formNotes,
    });
    saving = false;
    if (!result.ok) {
      formError = result.error ?? 'Could not save the document.';
      return;
    }
    showDocModal = false;
  }

  // --- Confirm delete modal ---
  /** @type {string | null} */
  let pendingDeleteId = $state(null);
  let removeError = $state('');

  async function confirmRemove() {
    if (!pendingDeleteId) return;
    const result = await removeDocument(pendingDeleteId);
    if (!result.ok) {
      removeError = result.error ?? 'Could not remove the document.';
      return;
    }
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
    {#if !documentsStatus.loaded && documentsStatus.loading}
      <div class="text-center py-8">
        <p class="text-sm text-ink-soft">Loading documents...</p>
      </div>
    {:else if documentsStatus.error && !documentsStatus.loaded}
      <div class="text-center py-8">
        <p class="text-sm text-bad">{documentsStatus.error}</p>
        <button onclick={loadDocuments} class="mt-3 rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft">Try again</button>
      </div>
    {:else if filtered.length > 0}
      {#each filtered as doc, i (doc.id)}
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
                <img src={Edit} alt="Edit" width="15" height="15" />
              </button>
              <button
                onclick={() => (pendingDeleteId = doc.id)}
                aria-label="Remove {doc.name}"
                class="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-bad-soft hover:text-bad"
              >
                <img src={Trash} alt="Remove" width="15" height="15" />
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
      {/each}
    {:else}
      <p class="p-6 text-center text-sm text-ink-faint">No documents found.</p>
    {/if}
  </div>
</div>

{#if showDocModal}
  <Modal
    title={editingDoc ? `${editingHeld ? 'Edit' : 'Add'} ${editingDoc.name}` : 'Add Document'}
    onClose={() => (showDocModal = false)}
  >
    {#snippet children()}
      <form id="doc-form" class="space-y-4" onsubmit={submitDocForm}>
        {#if formError}
          <p class="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{formError}</p>
        {/if}
        <label class="block">
          <span class="text-sm font-medium text-ink">Document type</span>
          <select
            bind:value={editingId}
            onchange={() => editingId && fillForm(editingId)}
            class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            {#each Object.values(documentLibrary) as d}
              <option value={d.id}>{d.name}</option>
            {/each}
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium text-ink">Issue date</span>
          <input type="date" bind:value={formIssueDate} class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
        </label>
        {#if editingDoc?.expirable}
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
      <button type="submit" form="doc-form" disabled={saving} class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? 'Saving…' : editingHeld ? 'Save Changes' : 'Add Document'}
      </button>
    {/snippet}
  </Modal>
{/if}

{#if pendingDeleteId}
  <Modal title="Remove document?" size="sm" onClose={() => { pendingDeleteId = null; removeError = ''; }}>
    {#snippet children()}
      <p class="text-sm text-ink-soft">
        This will remove {documentLibrary[pendingDeleteId ?? '']?.name ?? 'this document'} from your inventory.
        ReqCheck never stored a file for it, so this just clears the record.
      </p>
      {#if removeError}
        <p class="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{removeError}</p>
      {/if}
    {/snippet}
    {#snippet footer()}
      <button onclick={() => { pendingDeleteId = null; removeError = ''; }} class="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft">
        Cancel
      </button>
      <button onclick={confirmRemove} class="rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
        Remove
      </button>
    {/snippet}
  </Modal>
{/if}

