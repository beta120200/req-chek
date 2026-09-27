// Recent-activity feed shown on the Dashboard. Purely cosmetic —
// entries are capped and just describe what happened, when.
export const activity = $state({ items: [] });

let counter = 0;

function timeLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function logActivity(title, detail = '') {
  activity.items.unshift({ id: ++counter, title, detail, time: timeLabel() });
  if (activity.items.length > 8) activity.items.length = 8;
}

export function clearActivity() {
  activity.items = [];
}
