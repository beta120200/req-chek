<script>
  import { push } from "svelte-spa-router";
  import { api } from "../lib/api/client.js";
  import { authState } from "../lib/state/authState.svelte.js";
  import {
    documentLibrary,
    loadDocuments,
  } from "../lib/state/appState.svelte.js";
  import { showToast } from "../lib/state/toastState.svelte.js";
  import { guestSaveDocument } from "../lib/state/guestState.svelte.js";

  const MAX_BYTES = 5 * 1024 * 1024;

  // The whole document library, same source as My Documents.
  let idOptions = $derived(
    Object.values(documentLibrary).sort((a, b) => a.name.localeCompare(b.name)),
  );

  let selectedType = $state("");
  /** @type {string | null} */
  $effect(() => {
    if (authState.ready && Object.keys(documentLibrary).length === 0)
      loadDocuments();
  });

  $effect(() => {
    if (idOptions.length && !idOptions.some((d) => d.id === selectedType)) {
      selectedType = idOptions[0].id;
    }
  });

  let imageUrl = $state(null);
  /** @type {HTMLInputElement | null} */
  let fileInput = $state(null);
  let analyzing = $state(false);
  /** @type {{ expiryDate: string | null; note: string; rawText: string; saved: boolean } | null} */
  let result = $state(null);
  /** @type {string | null} */
  let errorMessage = $state(null);

  function onFileChosen(e) {
    const file = e.target?.files?.[0];
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    result = null;
    errorMessage = null;
    if (!file) {
      imageUrl = null;
      return;
    }
    if (file.size > MAX_BYTES) {
      imageUrl = null;
      e.target.value = "";
      errorMessage =
        "That image is larger than 5 MB. Please choose a smaller one.";
      return;
    }
    imageUrl = URL.createObjectURL(file);
  }

  async function analyze() {
        if (!imageUrl || !selectedType || analyzing) return;

    const file = fileInput?.files?.[0];
    if (!file) {
      errorMessage = "Please select an image file.";
      return;
    }

    const formData = new FormData();
    formData.append("idType", selectedType); // text fields first, then the file
    formData.append("idImage", file);

    analyzing = true;
    errorMessage = null;
    result = null;

    try {
      const data = await api.upload("/api/id-check", formData);
      result = {
        expiryDate: data.expiryDate,
        note: data.note,
        rawText: data.rawText,
        saved: data.saved,
      };
      if (authState.isGuest && data.expiryDate) {
        // For guests the API only reads the image; keep the result in the in-memory guest data.
        guestSaveDocument(
          selectedType,
          { expiryDate: data.expiryDate, notes: data.note },
          documentLibrary[selectedType]?.name,
        );
        result.saved = true;
        await loadDocuments();
      } else if (data.saved) {
        await loadDocuments();
      }
    } catch (err) {
      console.error("ID check failed:", err);
      errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred during ID analysis.";
    } finally {
      analyzing = false;
    }
  }

  function applyResult() {
    push("/app/documents");
    if (result?.saved) showToast("ID check result saved to your documents.");
  }

  function goBack() {
    push("/app/documents");
  }
</script>

<div class="space-y-6">
  <button
    onclick={goBack}
    class="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand"
  >
    <svg viewBox="0 0 24 24" width="15" height="15"
      ><path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      /></svg
    >
    Back to My Documents
  </button>

  <div
    class="mx-auto max-w-xl space-y-5 rounded-2xl border border-line bg-paper-raised p-6"
  >
    <div>
      <h2 class="text-xl font-bold text-ink">ID Expiration Check</h2>
      <p class="mt-1 text-sm text-ink-soft">
        Upload an image of your supported ID. ReqCheck extracts the expiration
        date and checks whether it's still valid. (This feature uses OCR to
        analyze the image and saves the result to your documents.)
      </p>
    </div>

    {#if errorMessage}
      <div class="rounded-xl border border-line bg-paper p-4">
        <p class="text-sm text-ink">{errorMessage}</p>
      </div>
    {/if}

    <label class="block">
      <span class="text-sm font-medium text-ink">Which ID is this?</span>
      <select
        bind:value={selectedType}
        onchange={() => {
          result = null;
          errorMessage = null;
        }}
        class="mt-1 w-full rounded-lg border border-line-strong px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
      >
        {#each idOptions as doc (doc.id)}
          <option value={doc.id}>{doc.name}</option>
        {/each}
      </select>
    </label>

    <input
      bind:this={fileInput}
      onchange={onFileChosen}
      type="file"
      accept="image/*"
      class="hidden"
    />
    <button
      type="button"
      onclick={() => fileInput?.click()}
      class="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line-strong bg-paper p-8 text-center hover:border-brand"
    >
      {#if imageUrl}
        <img
          src={imageUrl}
          alt="Uploaded ID preview"
          class="max-h-40 rounded-lg object-contain"
        />
      {:else}
        <svg viewBox="0 0 24 24" width="30" height="30" class="text-ink-faint"
          ><path
            d="M12 16V4M7 9l5-5 5 5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          /><path
            d="M4 16v3.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V16"
            stroke="currentColor"
            stroke-width="1.8"
            fill="none"
          /></svg
        >
      {/if}
      <span class="text-sm font-semibold text-brand"
        >{imageUrl ? "Choose a different image" : "Choose Image"}</span
      >
    </button>

    {#if analyzing}
      <div
        class="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Analyzing…
      </div>
    {:else if imageUrl}
      <button
        onclick={analyze}
        class="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark"
      >
        Analyze ID
      </button>
    {/if}

    {#if result}
      <div class="rounded-xl border border-line bg-paper p-4">
        <p class="text-sm font-semibold text-ink">
          {result.expiryDate
            ? `Detected expiration: ${result.expiryDate}`
            : "No expiration date detected"}
        </p>
        <p class="mt-1 text-sm text-ink-soft">{result.note}</p>
        {#if result.rawText}
          <p class="mt-1 text-xs text-ink-faint break-all">
            Extracted text preview: {result.rawText}
          </p>
        {/if}
        <button
          onclick={applyResult}
          class="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Go to My Documents
        </button>
      </div>
    {/if}
  </div>
</div>
