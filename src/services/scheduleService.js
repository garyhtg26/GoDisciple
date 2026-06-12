import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

function toMs(ts) {
  if (!ts) return 0;
  return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
}

export async function getSchedules(groupId = null) {
  let q;
  if (groupId) {
    q = query(
      collection(db, 'schedules'),
      where('groupId', '==', groupId),
      orderBy('startDateTime', 'asc'),
    );
  } else {
    q = query(
      collection(db, 'schedules'),
      where('isPublic', '==', true),
      orderBy('startDateTime', 'asc'),
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

// All schedules the user may see: every public event, plus the events of
// their own group (if any). Sorted client-side to avoid composite indexes.
export async function getSchedulesForUser(groupId = null) {
  const fetches = [
    getDocs(query(collection(db, 'schedules'), where('isPublic', '==', true))),
  ];
  if (groupId) {
    fetches.push(
      getDocs(query(collection(db, 'schedules'), where('groupId', '==', groupId))),
    );
  }
  const snaps = await Promise.all(fetches);
  const map = new Map();
  snaps.forEach(snap =>
    snap.docs.forEach(d => map.set(d.id, { ...d.data(), id: d.id })),
  );
  return Array.from(map.values()).sort(
    (a, b) => toMs(a.startDateTime) - toMs(b.startDateTime),
  );
}

export async function getSchedule(scheduleId) {
  const snap = await getDoc(doc(db, 'schedules', scheduleId));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id };
}

// ── RSVP ─────────────────────────────────────────────────────────────────────
// Doc ID `${scheduleId}_${userId}` keeps one RSVP per user per event and lets
// security rules verify ownership without a query.

export async function setRsvp(scheduleId, userId, status, userName = null) {
  await setDoc(doc(db, 'scheduleRsvps', `${scheduleId}_${userId}`), {
    scheduleId,
    userId,
    status, // 'going' | 'not_going'
    userName,
    updatedAt: serverTimestamp(),
  });
}

export async function getMyRsvp(scheduleId, userId) {
  const snap = await getDoc(doc(db, 'scheduleRsvps', `${scheduleId}_${userId}`));
  return snap.exists() ? snap.data().status : null;
}

export async function getRsvpCounts(scheduleId) {
  const snap = await getDocs(
    query(collection(db, 'scheduleRsvps'), where('scheduleId', '==', scheduleId)),
  );
  let going = 0, notGoing = 0;
  snap.docs.forEach(d => {
    if (d.data().status === 'going') going++;
    else if (d.data().status === 'not_going') notGoing++;
  });
  return { going, notGoing };
}

export async function createSchedule(data) {
  await addDoc(collection(db, 'schedules'), {
    title: data.title,
    type: data.type,
    description: data.description || '',
    location: data.location || '',
    startDateTime: data.startDateTime,
    endDateTime: data.endDateTime || null,
    groupId: data.groupId || null,
    createdBy: data.createdBy,
    isPublic: data.isPublic !== false,
    createdAt: serverTimestamp(),
  });
}
