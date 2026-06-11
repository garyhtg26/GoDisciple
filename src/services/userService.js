import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export async function createUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || null,
    photoURL: data.photoURL || null,
    role: 'member',
    groupId: null,
    leaderClaimCode: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id };
}

export async function updateUserProfile(uid, updates) {
  await updateDoc(doc(db, 'users', uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}
