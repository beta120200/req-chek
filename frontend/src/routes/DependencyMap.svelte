<script>
  import { service, DOCUMENT_LIBRARY } from '../lib/data/serviceData.js';
  import { documents } from '../lib/state/appState.svelte.js';
  import { evaluateRequirement } from '../lib/data/readiness.js';
  import { selectedServices, getActiveService, getActiveServiceIndex, setActiveService } from '../lib/state/serviceState.svelte.js';
  import DependencyNode from '../lib/components/DependencyNode.svelte';

  // Use the user-selected service for backward compatibility
  let activeService = $derived(getActiveService());
  let evaluation = $derived(evaluateRequirement(documents, activeService.requirement));

  function pathFor(optionId) {
    return evaluation.paths.find((p) => p.option.id === optionId);
  }

  let selectedId = $state('requirement');

  // Assemble a lookup of every node's detail info, recomputed whenever
  // documents change (so toggling a document updates the open panel too).
  let nodeDetails = $derived({
    root: {
      title: activeService.name,
      subtitle: activeService.office,
      status: 'neutral',
      body: activeService.description,
    },
    requirement: {
      title: activeService.requirement.name,
      subtitle: evaluation.satisfied ? 'Satisfied' : 'Not yet satisfied',
      status: evaluation.satisfied ? 'satisfied' : 'missing',
      body: activeService.requirement.why,
    },
    ...Object.fromEntries(
      activeService.requirement.options.map((option) => {
        const path = pathFor(option.id);
        return [
          option.id,
          {
            title: option.name,
            subtitle: path && path.satisfied ? 'You have this' : option.dependsOn ? 'Needs a prerequisite first' : 'No prerequisite needed',
            status: evaluation.satisfied ? 'not-needed' : path && path.satisfied ? 'satisfied' : option.id === evaluation.bestPath.option.id && !evaluation.satisfied ? 'warning' : 'missing',
            body: `${option.note} Source: ${DOCUMENT_LIBRARY[option.docId].source}.`,
          },
        ];
      })
    ),
    ...Object.fromEntries(
      activeService.requirement.options
        .filter((o) => o.dependsOn)
        .map((option) => {
          // Since we filtered for o.dependsOn, we know it's truthy
          // But let's be extra safe for TypeScript/runtime robustness
          const dependsOn = option.dependsOn;
          if (!dependsOn) {
            return null; // Skip this entry if dependsOn is falsy
          }
          const docType = DOCUMENT_LIBRARY[dependsOn] ?? { name: 'Unknown', source: 'Unknown' };
          const held = !!documents[dependsOn]?.held;
          return [
            dependsOn,
            {
              title: docType.name,
              subtitle: held ? 'You have this' : 'Prerequisite for ' + option.name,
              status: evaluation.satisfied ? 'not-needed' : held ? 'satisfied' : 'missing',
              body: `Required before you can apply for ${option.name}. Source: ${docType.source}.`,
            },
          ];
        })
        .filter(Boolean) // Remove any null entries
    ),
  });

  let selected = $derived(nodeDetails[selectedId]);
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-xl font-bold text-ink">Dependency Map</h2>
    <p class="text-ink-soft">See the chain of prerequisites behind the requirement — not just an unordered checklist.</p>
    <div class="my-4 w-1/6">
      <select
        id="service-select"
        onchange={(e) => {
          const target = e.target;
          if (target && typeof target === 'object' && 'value' in target) {
            setActiveService(Number(target.value));
          }
        }}
        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        {#each selectedServices as service, index}
          <option value={index} selected={getActiveServiceIndex() === index}>
            {service.name}
          </option>
        {/each}
      </select>
    </div>
  </div>

  <div class="grid gap-6 lg:grid-cols-[1fr_300px]">
    <div class="overflow-x-auto rounded-2xl border border-line bg-paper p-6">
      <div class="flex min-w-max flex-col items-center gap-2">
        <DependencyNode
          title={activeService.name}
          subtitle={activeService.office}
          status="neutral"
          selected={selectedId === 'root'}
          onSelect={() => (selectedId = 'root')}
        />

        <svg viewBox="0 0 24 24" width="18" height="18" class="text-ink-faint"><path d="M12 5v13M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>

        <DependencyNode
          title={activeService.requirement.name}
          subtitle="Any ONE option below satisfies this"
          status={evaluation.satisfied ? 'satisfied' : 'missing'}
          selected={selectedId === 'requirement'}
          onSelect={() => (selectedId = 'requirement')}
        />

        <svg viewBox="0 0 24 24" width="18" height="18" class="text-ink-faint"><path d="M12 5v13M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>

        <div class="flex gap-8">
          {#each activeService.requirement.options as option}
            {@const path = pathFor(option.id)}
            <div class="flex flex-col items-center gap-2">
              <DependencyNode
                title={option.name}
                subtitle={path && path.satisfied ? 'Satisfied' : 'Missing'}
                status={evaluation.satisfied ? 'not-needed' : path && path.satisfied ? 'satisfied' : option.id === evaluation.bestPath.option.id && !evaluation.satisfied ? 'warning' : 'missing'}
                selected={selectedId === option.id}
                onSelect={() => (selectedId = option.id)}
              />
              {#if option.dependsOn}
                <svg viewBox="0 0 24 24" width="16" height="16" class="text-ink-faint"><path d="M12 5v13M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <DependencyNode
                  title={DOCUMENT_LIBRARY[option.dependsOn].name}
                  subtitle={documents[option.dependsOn]?.held ? 'Satisfied' : evaluation.satisfied ? 'Not needed' : 'Missing'}
                  status={documents[option.dependsOn]?.held ? 'satisfied' : evaluation.satisfied ? 'not-needed' : 'missing'}
                  selected={selectedId === option.dependsOn}
                  onSelect={() => (selectedId = option.dependsOn)}
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
  </div>
</div>
