// Notifications — a mix of a static "requirement changed" demo
// (mirroring the kind of change-detection the proposal describes)
// and a dynamic expiry warning derived from the current document
// inventory at seed time.
import { documents } from './appState.svelte.js';
import { documentStatus, daysUntilExpiry } from '../data/readiness.js';
import { DOCUMENT_LIBRARY } from '../data/serviceData.js';

function seed() {
  const items = [];
  let id = 1;

  const studentIdStatus = documentStatus(documents, 'student-id');
  if (studentIdStatus === 'expiring' || studentIdStatus === 'expired') {
    const remaining = daysUntilExpiry(documents, 'student-id');
    items.push({
      id: id++,
      type: 'expiring',
      title: studentIdStatus === 'expired' ? "Student's ID has expired" : "Student's ID is expiring soon",
      message:
        studentIdStatus === 'expired'
          ? "Your Student's ID is past its expiry date and no longer counts toward Primary Identification."
          : `Your Student's ID expires in ${remaining} day${remaining === 1 ? '' : 's'}. Renew it or line up a backup ID.`,
      date: 'Today',
      read: false,
      docId: 'student-id',
    });
  }

  items.push({
    id: id++,
    type: 'requirement-change',
    title: 'Requirement updated: PWD ID',
    message: 'The Social Welfare & Development Office now asks for 2 recent 1x1 ID photos (previously 1).',
    date: '2 days ago',
    read: false,
    detail: {
      title: DOCUMENT_LIBRARY['pwd-id'].name,
      from: '1 recent 1x1 ID photo',
      to: '2 recent 1x1 ID photos',
      source: DOCUMENT_LIBRARY['pwd-id'].source,
      lastVerified: DOCUMENT_LIBRARY['pwd-id'].lastVerified,
    },
  });

  items.push({
    id: id++,
    type: 'info',
    title: 'Welcome to ReqCheck',
    message: "We've pre-loaded a demo document inventory so you can explore Voter's ID readiness right away.",
    date: '5 days ago',
    read: true,
  });

  return items;
}

export const notificationState = $state({ items: seed() });

export function unreadCount() {
  return notificationState.items.filter((n) => !n.read).length;
}

export function markAllRead() {
  notificationState.items.forEach((n) => (n.read = true));
}

export function clearAllNotifications() {
  notificationState.items = [];
}
