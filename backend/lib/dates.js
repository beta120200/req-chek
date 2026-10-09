// ReqCheck is a Philippines-focused app, so "today" is computed in
// Asia/Manila (UTC+8, no DST). This keeps expiry math identical no matter
// which timezone the server runs in.
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

/** Today's date in Manila as YYYY-MM-DD. */
export function todayISO(now = new Date()) {
  return new Date(now.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

/** Whole days from today until `dateStr` (negative = already past). null if no/invalid date. */
export function daysUntil(dateStr, now = new Date()) {
  if (!dateStr) return null;
  const target = Date.parse(`${String(dateStr).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(target)) return null;
  const today = Date.parse(`${todayISO(now)}T00:00:00Z`);
  return Math.round((target - today) / DAY_MS);
}

/** True when `value` is a real calendar date in YYYY-MM-DD form. */
export function isISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
