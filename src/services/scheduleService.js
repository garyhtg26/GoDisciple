import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

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
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
