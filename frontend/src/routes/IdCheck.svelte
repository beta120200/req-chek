<script>
  import { push } from 'svelte-spa-router';
  import { DOCUMENT_LIBRARY } from '../lib/data/serviceData.js';
  import { saveDocument } from '../lib/state/appState.svelte.js';
  import { showToast } from '../lib/state/toastState.svelte.js';

  const idOptions = ['national-id', 'pwd-id', 'student-id'];

  let selectedType = $state('national-id');
  let imageUrl = $state(null);
  let fileInput;
  let analyzing = $state(false);
  let result = $state(null);

  function onFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    imageUrl = URL.createObjectURL(file);
    result = null;
  }

  function daysFromToday(n) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  // Simulated OCR: no real text recognition happens here — this is a
  // frontend mockup. Each ID type returns a plausible demo result.
  function analyze() {
    analyzing = true;
    result = null;
    setTimeout(() => {
      analyzing = false;
      if (selectedType === 'national-id') {
        result = { expiryDate: null, note: 'PhilSys National IDs do not carry an expiration date.' };
      } else if (selectedType === 'pwd-id') {
        result = { expiryDate: daysFromToday(730), note: 'Detected a validity period of about 2 years from issuance.' };
      } else {
        result = { expiryDate: daysFromToday(150), note: 'Detected validity through the end of the current school year.' };
      }
    }, 900);
  }

  function applyResult() {
    saveDocument(selectedType, { expiryDate: result.expiryDate, notes: 'Added via ID Expiration Check.' });
    showToast(`${DOCUMENT_LIBRARY[selectedType].name} updated from ID check.`);
    push('/app/documents');
  }
</script>

<div class="space-y-6">
  <button
    onclick={() => push('/app/documents')}
    class="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand"
  >
    <svg viewBox="0 0 24 24" width="15" height="15"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Back to My Documents
  </button>

  <div class="mx-auto max-w-xl space-y-5 rounded-2xl border border-line bg-paper-raised p-6">
    <div>
      <h2 class="text-xl font-bold text-ink">ID Expiration Check</h2>
      <p class="mt-1 text-sm text-ink-soft">
        Upload an image of your supported ID. ReqCheck extracts the expiration date and checks whether
        it's still valid. (This is a simulated demo — no image is analyzed or uploaded anywhere.)
      </p>
    </div>

    <label class="block">
      <span class="text-sm font-medium text-ink">Which ID is this?</span>
      <select
        bind:value={selectedType}
        onchange={() => { result = null; }}
        class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
      >
        {#each idOptions as id}
          <option value={id}>{DOCUMENT_LIBRARY[id].name}</option>
        {/each}
      </select>
    </label>

    <button
      onclick={() => fileInput.click()}
      class="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line-strong bg-paper p-8 text-center hover:border-brand"
    >
      <input bind:this={fileInput} onchange={onFileChosen} type="file" accept="image/*" class="hidden" />
      {#if imageUrl}
        <img src={imageUrl} alt="Uploaded ID preview" class="max-h-40 rounded-lg object-contain" />
      {:else}
        <svg viewBox="0 0 24 24" width="30" height="30" class="text-ink-faint"><path d="M12 16V4M7 9l5-5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M4 16v3.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V16" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>
      {/if}
      <span class="text-sm font-semibold text-brand">{imageUrl ? 'Choose a different image' : 'Choose Image'}</span>
    </button>

    <button
      onclick={analyze}
      disabled={!imageUrl || analyzing}
      class="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
    >
      {analyzing ? 'Analyzing…' : 'Analyze ID'}
    </button>

    {#if result}
      <div class="rounded-xl border border-line bg-paper p-4">
        <p class="text-sm font-semibold text-ink">
          {result.expiryDate ? `Detected expiration: ${result.expiryDate}` : 'No expiration date detected'}
        </p>
        <p class="mt-1 text-sm text-ink-soft">{result.note}</p>
        <button
          onclick={applyResult}
          class="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Save to My Documents
        </button>
      </div>
    {/if}
  </div>
</div>
