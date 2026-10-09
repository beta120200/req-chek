<script>
  import { push, router } from 'svelte-spa-router';
  import { openMobileSidebar } from '../state/uiState.svelte.js';
  import { authState, initialsOf, logout } from '../state/authState.svelte.js';
  import { notificationState, unreadCount, markAllRead } from '../state/notificationState.svelte.js';
  import Logo from '../../assets/logo.svg';
  
  const titles = {
    '/app': 'Dashboard',
    '/app/check-readiness': 'Check Your Readiness',
    '/app/assessment': 'Service Assessment',
    '/app/documents': 'My Documents',
    '/app/dependency-map': 'Dependency Map',
    '/app/route': 'Preparation Route',
    '/app/id-check': 'ID Expiration Check',
    '/app/requirements': 'Requirements Directory',
    '/app/notifications': 'Notifications',
    '/app/settings': 'Settings',
    '/app/help': 'Help',
  };

  let title = $derived(titles[router.location] ?? 'ReqCheck');

  let showNotifDropdown = $state(false);
  let showUserDropdown = $state(false);

  function toggleNotifDropdown() {
    showUserDropdown = false;
    showNotifDropdown = !showNotifDropdown;
    if (showNotifDropdown) markAllRead();
  }
  function toggleUserDropdown() {
    showNotifDropdown = false;
    showUserDropdown = !showUserDropdown;
  }
  function closeDropdowns() {
    showNotifDropdown = false;
    showUserDropdown = false;
  }

  function goTo(path) {
    closeDropdowns();
    push(path);
  }

  function handleLogout() {
    closeDropdowns();
    logout();
    push('/');
  }
</script>

<svelte:window onclick={closeDropdowns} />

<header class="flex h-16 items-center gap-3 border-b border-line bg-paper-raised px-4 md:px-8">
  <button
    class="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-brand-soft hover:text-brand md:hidden"
    aria-label="Open menu"
    onclick={openMobileSidebar}
  >
    <svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
  </button>

  <h1 class="text-lg font-bold text-ink">{title}</h1>

  <div class="ml-auto flex items-center gap-2">
    <div class="relative">
      <button
        aria-label="Notifications"
        onclick={(e) => { e.stopPropagation(); toggleNotifDropdown(); }}
        class="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-brand-soft hover:text-brand"
      >
        <svg viewBox="0 0 24 24" width="19" height="19"><path d="M12 3.5c-2.9 0-5 2.2-5 5.2v3.4L5.2 15h13.6L17 12.1V8.7c0-3-2.1-5.2-5-5.2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
        {#if unreadCount() > 0}
          <span class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unreadCount()}
          </span>
        {/if}
      </button>

      {#if showNotifDropdown}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={(e) => e.stopPropagation()}
          class="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-line bg-paper-raised p-2 shadow-xl"
        >
          <div class="flex items-center justify-between px-2 py-1.5">
            <span class="text-sm font-bold text-ink">Notifications</span>
            <button onclick={() => goTo('/app/notifications')} class="text-xs font-semibold text-brand hover:underline">View all</button>
          </div>
          {#if notificationState.items.length === 0}
            <p class="px-2 py-4 text-center text-sm text-ink-faint">You're all caught up.</p>
          {:else}
            <div class="max-h-72 space-y-1 overflow-y-auto">
              {#each notificationState.items.slice(0, 5) as n}
                <div class="rounded-lg px-2 py-2 hover:bg-paper">
                  <p class="text-sm font-semibold text-ink">{n.title}</p>
                  <p class="mt-0.5 text-xs text-ink-soft">{n.message}</p>
                  <p class="mt-0.5 text-[11px] text-ink-faint">{n.date}</p>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="relative">
      <button
        onclick={(e) => { e.stopPropagation(); toggleUserDropdown(); }}
        class="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-brand-soft"
      >
        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
          {initialsOf(authState.name)}
        </span>
        <span class="hidden text-sm font-medium text-ink-soft sm:inline">{authState.name}</span>
        <span class="hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline {authState.isGuest ? 'bg-brand-soft text-brand' : 'bg-good-soft text-good'}">
          {authState.isGuest ? 'Guest' : 'Member'}
        </span>
        <svg viewBox="0 0 24 24" width="14" height="14" class="text-ink-faint"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>

      {#if showUserDropdown}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={(e) => e.stopPropagation()}
          class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-paper-raised py-1 shadow-xl"
        >
          <div class="px-4 py-2">
            <p class="text-sm font-semibold text-ink">{authState.name}</p>
            <p class="text-xs text-ink-faint">{authState.isGuest ? 'Guest session — log in to save your data' : authState.email}</p>
          </div>
          <div class="my-1 border-t border-line"></div>
          <button onclick={() => goTo('/app/settings')} class="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-paper">Settings</button>
          <button onclick={() => goTo('/app/help')} class="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-paper">Help</button>
          <div class="my-1 border-t border-line"></div>
          {#if authState.isGuest}
            <button onclick={() => goTo('/login')} class="block w-full px-4 py-2 text-left text-sm font-semibold text-brand hover:bg-paper">Log in</button>
          {:else}
            <button onclick={handleLogout} class="block w-full px-4 py-2 text-left text-sm font-semibold text-bad hover:bg-paper">Log out</button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</header>
