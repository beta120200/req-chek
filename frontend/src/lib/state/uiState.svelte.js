// UI-only reactive state (not app/document data) — sidebar
// open/collapsed state shared between Sidebar and Topbar.
export const uiState = $state({
  mobileSidebarOpen: false,
  sidebarCollapsed: false,
  guestBannerDismissed: false,
});

export function dismissGuestBanner() {
  uiState.guestBannerDismissed = true;
}

export function openMobileSidebar() {
  uiState.mobileSidebarOpen = true;
}

export function closeMobileSidebar() {
  uiState.mobileSidebarOpen = false;
}

export function toggleSidebarCollapsed() {
  uiState.sidebarCollapsed = !uiState.sidebarCollapsed;
}
