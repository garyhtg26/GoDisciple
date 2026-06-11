import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getBanners() {
  const snap = await getDocs(query(collection(db, 'banners'), orderBy('order', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getNews(count = 5) {
  const snap = await getDocs(
    query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(count)),
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getActiveBibleTheme() {
  const snap = await getDocs(
    query(collection(db, 'bibleThemes'), where('isActive', '==', true), limit(1)),
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function getBibleThemes() {
  const snap = await getDocs(
    query(collection(db, 'bibleThemes'), orderBy('startDate', 'desc')),
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBibleTheme(themeId) {
  const snap = await getDoc(doc(db, 'bibleThemes', themeId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getAppSettings() {
  const snap = await getDoc(doc(db, 'appSettings', 'main'));
  if (!snap.exists()) return {};
  return snap.data();
}
