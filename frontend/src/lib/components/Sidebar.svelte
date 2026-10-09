<script>
  import { push, router } from 'svelte-spa-router';
  import { uiState, closeMobileSidebar, toggleSidebarCollapsed } from '../state/uiState.svelte.js';
  import { unreadCount } from '../state/notificationState.svelte.js';
  import AddServiceModal from './AddServiceModal.svelte';
  import Logo from '../../assets/logo.svg';

  const navGroups = [
    {
      label: 'Overview',
      links: [{ path: '/app', label: 'Dashboard', icon: 'grid' }],
    },
    {
      label: 'Preparation',
      links: [
        { path: '/app/check-readiness', label: 'Check Readiness', icon: 'check' },
        { path: '/app/documents', label: 'My Documents', icon: 'doc' },
        { path: '/app/route', label: 'Preparation Route', icon: 'route' },
        { path: '/app/dependency-map', label: 'Dependency Map', icon: 'map' },
      ],
    },
    {
      label: 'Information',
      links: [
        { path: '/app/requirements', label: 'Requirements', icon: 'list' },
        { path: '/app/notifications', label: 'Notifications', icon: 'bell', badge: true },
      ],
    },
  ];

  const bottomLinks = [
    { path: '/app/settings', label: 'Settings', icon: 'gear' },
    { path: '/app/help', label: 'Help', icon: 'help' },
  ];

  const icons = {
    grid: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
    check: 'M4 12.5 9.5 18 20 6',
    doc: 'M5 3h9l5 5v13H5zM8 8h7M8 12h7M8 16h4',
    route: 'M6 6a2 2 0 100 4 2 2 0 000-4zM18 14a2 2 0 100 4 2 2 0 000-4zM8 8l8 8',
    map: 'M12 4a2 2 0 100 4 2 2 0 000-4zM6 20a2 2 0 100 4 2 2 0 000-4zM18 20a2 2 0 100 4 2 2 0 000-4zM12 8v6M12 14l-6 6M12 14l6 6',
    list: 'M5 4h10l4 4v12H5zM8 12h8M8 16h5',
    bell: 'M12 3.5c-2.9 0-5 2.2-5 5.2v3.4L5.2 15h13.6L17 12.1V8.7c0-3-2.1-5.2-5-5.2zM9.5 18.5a2.5 2.5 0 005 0',
    gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8L6.3 6.3',
    help: 'M9.8 9.3a2.2 2.2 0 113.1 2c-.8.5-1.1.9-1.1 1.9',
  };

  function isActive(path) {
    if (path === '/app') return router.location === '/app';
    return router.location?.startsWith(path);
  }

  function go(path) {
    push(path);
    closeMobileSidebar();
  }

  let showAddService = $state(false);
</script>

{#if uiState.mobileSidebarOpen}
  <button
    class="fixed inset-0 z-30 bg-ink/40 md:hidden"
    aria-label="Close menu"
    onclick={closeMobileSidebar}
  ></button>
{/if}

<aside
  class="fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 -translate-x-full flex-col border-r border-line bg-paper-raised transition-transform duration-200 md:static md:translate-x-0 {uiState.mobileSidebarOpen ? 'translate-x-0' : ''} {uiState.sidebarCollapsed ? 'md:w-[76px]' : 'md:w-64'}"
>
  <div class="flex h-16 items-center gap-2 border-b border-line px-5">
    <span class="flex h-8 w-8 shrink-0 items-center justify-center text-white cursor-pointer">
      <img src="{Logo}" alt="reqcheck" />
    </span>
    {#if !uiState.sidebarCollapsed}
      <span class="text-lg font-extrabold tracking-tight text-ink">ReqCheck</span>
    {/if}
    <button
      onclick={toggleSidebarCollapsed}
      aria-label={uiState.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      class="ml-auto hidden h-7 w-7 items-center justify-center rounded-md text-ink-faint hover:bg-brand-soft hover:text-brand md:flex"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" class="transition-transform {uiState.sidebarCollapsed ? 'rotate-180' : ''}"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>

  <nav class="flex-1 space-y-6 overflow-y-auto px-3 py-5">
    {#each navGroups as group}
      <div>
        {#if !uiState.sidebarCollapsed}
          <p class="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{group.label}</p>
        {/if}
        <div class="space-y-1">
          {#each group.links as link}
            <button
              onclick={() => go(link.path)}
              title={link.label}
              class="relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer {uiState.sidebarCollapsed ? 'justify-center' : ''} {isActive(link.path) ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:bg-brand-soft/60 hover:text-ink'}"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" class="shrink-0"><path d={icons[link.icon]} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {#if !uiState.sidebarCollapsed}
                <span>{link.label}</span>
              {/if}
              {#if link.badge && unreadCount() > 0}
                <span class="absolute {uiState.sidebarCollapsed ? 'right-1 top-1' : 'right-3 top-1/2 -translate-y-1/2'} flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
                  {unreadCount()}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </nav>

  <div class="w-full space-y-1 sticky bottom-0   border-t border-line p-3">
    {#each bottomLinks as link}
      <button
        onclick={() => go(link.path)}
        title={link.label}
        class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium cursor-pointer {uiState.sidebarCollapsed ? 'justify-center' : ''} {isActive(link.path) ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:bg-brand-soft/60 hover:text-ink'}"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" class="shrink-0"><path d={icons[link.icon]} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        {#if !uiState.sidebarCollapsed}<span>{link.label}</span>{/if}
      </button>
    {/each}
    <button
      onclick={() => (showAddService = true)}
      title="Add a Service"
      class="flex w-full items-center gap-2.5 rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-left text-sm font-medium text-ink-soft cursor-pointer hover:border-brand hover:bg-brand-soft hover:text-brand {uiState.sidebarCollapsed ? 'justify-center' : ''}"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" class="shrink-0"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      {#if !uiState.sidebarCollapsed}<span>Add a Service</span>{/if}
    </button>
  </div>
</aside>

{#if showAddService}
  <AddServiceModal onClose={() => (showAddService = false)} />
{/if}
