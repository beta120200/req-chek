// Ephemeral toast notifications (bottom-right stack). Each toast
// removes itself after a few seconds.
export const toastState = $state({ items: [] });

let counter = 0;

export function showToast(message) {
  const id = ++counter;
  toastState.items.push({ id, message });
  setTimeout(() => {
    const idx = toastState.items.findIndex((t) => t.id === id);
    if (idx !== -1) toastState.items.splice(idx, 1);
  }, 3200);
}

export function dismissToast(id) {
  const idx = toastState.items.findIndex((t) => t.id === id);
  if (idx !== -1) toastState.items.splice(idx, 1);
}
