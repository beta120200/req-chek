<script>
  import { createResource } from '../lib/api/resource.svelte.js';
  import { serviceState, setActiveService } from '../lib/state/serviceState.svelte.js';
  import DependencyNode from '../lib/components/DependencyNode.svelte';
  import AuthRequired from '../lib/components/AuthRequired.svelte';

  const map = createResource('/api/dependency-map');

  let selectedKey = $state('requirement');
  let nodes = $derived(map.data?.nodes ?? {});
  let options = $derived(map.data?.options ?? []);
  let selected = $derived(nodes[selectedKey] ?? null);

  async function onServiceChange(e) {
    await setActiveService(e.currentTarget.value);
    selectedKey = 'requirement';
    await map.reload();
  }
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-xl font-bold text-ink">Dependency Map</h2>
    <p class="text-ink-soft">See the chain of prerequisites behind the requirement — not just an unordered checklist.</p>
  </div>

  {#if map.needsLogin}
    <AuthRequired feature="the Dependency Map" />
  {:else}
    {#if serviceState.selected.length > 1}
      <div class="my-4 w-full max-w-xs">
        <label class="block">
          <span class="text-sm font-medium text-ink">Service</span>
          <select
            id="service-select"
            value={serviceState.activeServiceId}
            onchange={onServiceChange}
            class="mt-1 block w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            {#each serviceState.selected as service (service.id)}
              <option value={service.id}>{service.name}</option>
            {/each}
          </select>
        </label>
      </div>
    {/if}

    <div class="grid gap-6 lg:grid-cols-[1fr_300px]">
      {#if map.loading}
        <div class="col-span-2 py-8 text-center">
          <p class="text-sm text-ink-soft">Loading dependency map...</p>
        </div>
      {:else if map.code === 'no_service'}
        <div class="col-span-2 rounded-2xl border border-dashed border-line-strong bg-paper-raised/60 p-8 text-center text-sm text-ink-soft">
          You haven't added a service yet. Use "Add a Service" in the sidebar, then come back here.
        </div>
      {:else if map.error}
        <div class="col-span-2 py-8 text-center">
          <p class="text-sm text-bad">{map.error}</p>
        </div>
      {:else if map.data}
        <div class="overflow-x-auto rounded-2xl border border-line bg-paper p-6">
          <div class="flex min-w-max flex-col items-center gap-2">
            <DependencyNode
              title={nodes.root.title}
              subtitle={nodes.root.subtitle}
              status={nodes.root.status}
              selected={selectedKey === 'root'}
              onSelect={() => (selectedKey = 'root')}
            />

            <svg viewBox="0 0 24 24" width="18" height="18" class="text-ink-faint"><path d="M12 5v13M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>

            <DependencyNode
              title={nodes.requirement.title}
              subtitle={nodes.requirement.subtitle}
              status={nodes.requirement.status}
              selected={selectedKey === 'requirement'}
              onSelect={() => (selectedKey = 'requirement')}
            />

            <div class="flex gap-8">
              {#each options as opt (opt.key)}
                {@const option = nodes[opt.key]}
                {@const prerequisite = opt.prerequisiteKey ? nodes[opt.prerequisiteKey] : null}
                <div class="flex flex-col items-center gap-2">
                  <DependencyNode
                    title={option.title}
                    subtitle={option.subtitle}
                    status={option.status}
                    selected={selectedKey === opt.key}
                    onSelect={() => (selectedKey = opt.key)}
                  />
                  {#if prerequisite}
                    <svg viewBox="0 0 24 24" width="16" height="16" class="text-ink-faint"><path d="M12 5v13M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <DependencyNode
                      title={prerequisite.title}
                      subtitle={prerequisite.subtitle}
                      status={prerequisite.status}
                      selected={selectedKey === opt.prerequisiteKey}
                      onSelect={() => (selectedKey = opt.prerequisiteKey)}
                    />
                  {:else}
                    <p class="max-w-[11rem] text-center text-xs italic text-ink-faint">No prerequisite</p>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>

        <aside class="h-fit rounded-2xl border border-line bg-paper-raised p-5">
          {#if selected}
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-faint">{selected.subtitle}</p>
            <h3 class="mt-1 font-bold text-ink">{selected.title}</h3>
            <p class="mt-2 text-sm text-ink-soft">{selected.body}</p>
          {:else}
            <p class="text-sm text-ink-faint">Select a node to see its details.</p>
          {/if}
        </aside>
      {/if}
    </div>
  {/if}
</div>
