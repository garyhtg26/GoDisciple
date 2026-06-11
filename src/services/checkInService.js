import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export async function processCheckIn(scannedData, userId, groupId = null) {
  let parsed;
  try {
    parsed = JSON.parse(scannedData);
  } catch {
    throw new Error('Invalid QR code format.');
  }

  const { eventId, checkInCode } = parsed;
  if (!eventId || !checkInCode) throw new Error('QR code missing required fields.');

  const eventSnap = await getDoc(doc(db, 'events', eventId));
  if (!eventSnap.exists()) throw new Error('Event not found.');

  const eventData = eventSnap.data();
  if (eventData.checkInCode !== checkInCode) throw new Error('Invalid check-in code.');

  // prevent duplicate
  const existing = await getDocs(
    query(
      collection(db, 'attendance'),
      where('eventId', '==', eventId),
      where('userId', '==', userId),
    ),
  );
  if (!existing.empty) throw new Error('You have already checked in to this event.');

  await addDoc(collection(db, 'attendance'), {
    eventId,
    userId,
    groupId: groupId || null,
    checkedInAt: serverTimestamp(),
    method: 'qr',
    scannedCode: checkInCode,
  });

  return eventData;
}

export async function getAttendanceByEvent(eventId) {
  const snap = await getDocs(
    query(collection(db, 'attendance'), where('eventId', '==', eventId)),
  );
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}
