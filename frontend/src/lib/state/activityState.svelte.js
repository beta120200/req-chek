// Recent-activity feed shown on the Dashboard. The entries are recorded by the
// backend (user_activity table) and arrive with GET /api/dashboard.
export const activity = $state({ items: [] });

function timeLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** @param {Array<{id: string, title: string, createdAt: string}>} items */
export function setActivity(items) {
  activity.items = items.map((a) => ({ id: a.id, title: a.title, time: timeLabel(a.createdAt) }));
}

export function clearActivity() {
  activity.items = [];
}
