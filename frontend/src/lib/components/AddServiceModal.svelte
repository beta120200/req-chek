<script>
  import Modal from './Modal.svelte';
  import { SERVICES } from '../data/serviceData.js';
  import { addService } from '../state/serviceState.svelte.js';

  let { onClose } = $props();
</script>;

<Modal title="Add a Service to Check" {onClose}>
  {#snippet children()}
    <p class="text-sm text-ink-soft">
      Select a service to add to your checklist. Each service has different requirements and documents needed.
    </p>

    <div class="mt-4 space-y-4">
      {#each SERVICES as serviceItem}
        <div class="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 cursor-pointer hover:bg-brand-soft/50"
             onclick={() => {
               addService(serviceItem);
               onClose(); // Close the modal after adding
             }}>
          <div>
            <p class="font-semibold text-ink">{serviceItem.name}</p>
            <p class="text-xs text-ink-soft">{serviceItem.tagline}</p>
          </div>
          <span class="rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">Available</span>
        </div>
      {/each}
    </div>
  {/snippet}
  {#snippet footer()}
    <button onclick={onClose} class="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
      Done
    </button>
  {/snippet}
</Modal>
