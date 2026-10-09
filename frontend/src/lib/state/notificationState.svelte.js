// Notifications are derived from the user's documents (expired / expiring soon).
// They are rebuilt every time documents are (re)loaded from the backend.

/**
 * @typedef {Object} NotificationItem
 * @property {string} id
 * @property {string} type
 * @property {string} title
 * @property {string} message
 * @property {string} date
 * @property {boolean} read
 * @property {Object=} detail
 */

/** @type {{ items: NotificationItem[] }} */
export const notificationState = $state({ items: [] });

// Remember what was read / cleared so a reload of the same documents doesn't resurrect it.
const readIds = new Set();
const dismissedIds = new Set();

/**
 * @param {Record<string, {held: boolean, expiryDate: string|null, status: string, remaining: number|null}>} documents
 * @param {Record<string, {name: string}>} library
 */
export function rebuildNotifications(documents, library) {
  const today = new Date().toISOString().slice(0, 10);
  /** @type {NotificationItem[]} */
  const items = [];

  for (const [docId, doc] of Object.entries(documents)) {
    if (!doc.held || (doc.status !== 'expiring' && doc.status !== 'expired')) continue;
    const name = library[docId]?.name || docId;
    const id = `${doc.status}:${docId}:${doc.expiryDate}`;
    if (dismissedIds.has(id)) continue;

    items.push({
      id,
      type: 'expiring',
      title: doc.status === 'expired' ? `${name} has expired` : `${name} is expiring soon`,
      message:
        doc.status === 'expired'
          ? `It expired on ${doc.expiryDate}. Renew it to keep your requirements satisfied.`
          : `It expires on ${doc.expiryDate} (${doc.remaining} day${doc.remaining === 1 ? '' : 's'} left). Consider renewing.`,
      date: today,
      read: readIds.has(id),
    });
  }
  notificationState.items = items;
}

export function unreadCount() {
  return notificationState.items.filter((n) => !n.read).length;
}

export function markAllRead() {
  notificationState.items.forEach((n) => {
    n.read = true;
    readIds.add(n.id);
  });
}

export function clearAllNotifications() {
  notificationState.items.forEach((n) => dismissedIds.add(n.id));
  notificationState.items = [];
}
