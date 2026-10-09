<script>
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import Modal from "./Modal.svelte";
  import { api } from "../api/client.js";
  import { authState } from "../state/authState.svelte.js";
  import { addService } from "../state/serviceState.svelte.js";

  let { onClose } = $props();

  /** @type {Array<{id: string, name: string, tagline: string}>} */
  let services = $state([]);
  let isLoading = $state(true);
  /** @type {string | null} */
  let error = $state(null);
  /** @type {string | null} */
  let addingId = $state(null);

  onMount(async () => {
    try {
      const data = await api.get("/api/add-service");
      services = data.services || [];
    } catch (err) {
      console.error("Failed to fetch services:", err);
      error =
        err instanceof Error
          ? err.message
          : "Failed to load services. Please try again later.";
    } finally {
      isLoading = false;
    }
  });

  async function choose(serviceItem) {
    if (addingId) return;
    addingId = serviceItem.id;
    const result = await addService(serviceItem);
    addingId = null;
    if (!result.ok) {
      error = result.error ?? "Could not add the service.";
      return;
    }
    onClose();
    push("/app"); // the dashboard shows the newly active service
  }

  function goLogin() {
    onClose();
    push("/login");
  }
</script>

<Modal title="Add a Service to Check" {onClose}>
  {#snippet children()}
    {#if isLoading}
      <p class="text-sm text-ink-soft">
        Loading available services…
      </p>
    {:else if isLoading}
      <p class="text-sm text-ink-soft">Loading services...</p>
    {:else}
      {#if error}
        <p class="mb-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      {/if}
      {#if services.length === 0 && !error}
        <p class="text-sm text-ink-soft">
          You're already tracking every available service.
        </p>
      {:else}
        <p class="text-sm text-ink-soft">
          Select a service to add to your checklist. Each service has different
          requirements and documents needed.
        </p>

        <div class="mt-4 space-y-4">
          {#each services as serviceItem (serviceItem.id)}
            <button
              type="button"
              disabled={addingId !== null}
              onclick={() => choose(serviceItem)}
              class="flex w-full items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 text-left hover:bg-brand-soft/50 disabled:opacity-60"
            >
              <div>
                <p class="font-semibold text-ink">{serviceItem.name}</p>
                <p class="text-xs text-ink-soft">{serviceItem.tagline}</p>
              </div>
              <span
                class="rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white"
              >
                {addingId === serviceItem.id ? "Adding…" : "Add"}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  {/snippet}
  {#snippet footer()}
    {#if authState.isGuest}
      <button
        onclick={onClose}
        class="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >Done</button
      >
    {/if}
  {/snippet}
</Modal>
