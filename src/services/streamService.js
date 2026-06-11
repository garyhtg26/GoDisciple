import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const PAGE_SIZE = 15;

export async function getPosts(filterCategory = null, filterGroupId = null, lastDoc = null) {
  let q = query(collection(db, 'streamPosts'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

  if (filterCategory && filterCategory !== 'all') {
    q = query(
      collection(db, 'streamPosts'),
      where('category', '==', filterCategory),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    );
  }

  if (filterGroupId) {
    q = query(
      collection(db, 'streamPosts'),
      where('groupId', '==', filterGroupId),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    );
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snap = await getDocs(q);
  return {
    posts: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
  };
}

export async function createPost(data) {
  const ref = await addDoc(collection(db, 'streamPosts'), {
    authorId: data.authorId,
    authorName: data.authorName,
    authorPhotoURL: data.authorPhotoURL || null,
    content: data.content,
    category: data.category || 'general',
    visibility: data.visibility || 'public',
    groupId: data.groupId || null,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, 'streamPosts', postId));
}

export async function getComments(postId) {
  const snap = await getDocs(
    query(
      collection(db, 'streamComments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addComment(postId, data) {
  await addDoc(collection(db, 'streamComments'), {
    postId,
    authorId: data.authorId,
    authorName: data.authorName,
    authorPhotoURL: data.authorPhotoURL || null,
    content: data.content,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'streamPosts', postId), { commentCount: increment(1) });
}

export async function toggleLike(postId, userId) {
  const likeRef = doc(db, 'streamLikes', `${postId}_${userId}`);
  const likeSnap = await getDoc(likeRef);

  if (likeSnap.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(doc(db, 'streamPosts', postId), { likeCount: increment(-1) });
    return false;
  } else {
    await setDoc(likeRef, { postId, userId, createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'streamPosts', postId), { likeCount: increment(1) });
    return true;
  }
}

export async function hasUserLiked(postId, userId) {
  const snap = await getDoc(doc(db, 'streamLikes', `${postId}_${userId}`));
  return snap.exists();
}
