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

export async function getLessons({ category = null, count = 20 } = {}) {
  let q = query(
    collection(db, 'lessons'),
    where('isPublished', '==', true),
    orderBy('date', 'desc'),
    limit(count),
  );
  if (category) {
    q = query(
      collection(db, 'lessons'),
      where('isPublished', '==', true),
      where('category', '==', category),
      orderBy('date', 'desc'),
      limit(count),
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getLesson(lessonId) {
  const snap = await getDoc(doc(db, 'lessons', lessonId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getLessonCategories() {
  const snap = await getDocs(
    query(collection(db, 'lessons'), where('isPublished', '==', true)),
  );
  const cats = new Set();
  snap.docs.forEach(d => {
    const cat = d.data().category;
    if (cat) cats.add(cat);
  });
  return Array.from(cats).sort();
}
