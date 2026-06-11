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
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function getNews(count = 5) {
  const snap = await getDocs(
    query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(count)),
  );
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function getActiveBibleTheme() {
  const snap = await getDocs(
    query(collection(db, 'bibleThemes'), where('isActive', '==', true), limit(1)),
  );
  if (snap.empty) return null;
  return { ...snap.docs[0].data(), id: snap.docs[0].id };
}

export async function getBibleThemes() {
  // No orderBy here: Firestore drops documents missing the sort field,
  // and themes created without a start date would silently disappear.
  const snap = await getDocs(collection(db, 'bibleThemes'));
  const themes = snap.docs.map(d => ({ ...d.data(), id: d.id }));
  return themes.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return (b.startDate || '') < (a.startDate || '') ? -1 : 1;
  });
}

export async function getBibleTheme(themeId) {
  const snap = await getDoc(doc(db, 'bibleThemes', themeId));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id };
}

export async function getAppSettings() {
  const snap = await getDoc(doc(db, 'appSettings', 'main'));
  if (!snap.exists()) return {};
  return snap.data();
}
