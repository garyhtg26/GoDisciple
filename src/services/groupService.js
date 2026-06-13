import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getGroups() {
  const snap = await getDocs(collection(db, 'groups'));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function getGroup(groupId) {
  const snap = await getDoc(doc(db, 'groups', groupId));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id };
}

export async function updateGroup(groupId, updates) {
  await updateDoc(doc(db, 'groups', groupId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Remove a member (or co-leader) from the group and reset their profile.
// Permission is enforced by security rules: the group leader can kick members
// and co-leaders; a co-leader can kick regular members only.
export async function kickMember(groupId, targetUserId, { isCoLeader = false } = {}) {
  const groupSnap = await getDoc(doc(db, 'groups', groupId));
  if (!groupSnap.exists()) throw new Error('Group not found.');
  const g = groupSnap.data();

  // demote + detach the user first; rules validate this against the group doc
  await updateDoc(doc(db, 'users', targetUserId), {
    groupId: null,
    role: 'member',
    updatedAt: serverTimestamp(),
  });

  const updates = {
    memberIds: (g.memberIds || []).filter(uid => uid !== targetUserId),
    updatedAt: serverTimestamp(),
  };
  if (isCoLeader) {
    updates.coLeaderIds = (g.coLeaderIds || []).filter(uid => uid !== targetUserId);
  }
  await updateDoc(doc(db, 'groups', groupId), updates);
}

export async function requestJoinGroup(groupId, userId, message = '') {
  const existing = await getDocs(
    query(
      collection(db, 'groupJoinRequests'),
      where('groupId', '==', groupId),
      where('userId', '==', userId),
      where('status', '==', 'pending'),
    ),
  );
  if (!existing.empty) throw new Error('You already have a pending request for this group.');

  await addDoc(collection(db, 'groupJoinRequests'), {
    groupId,
    userId,
    status: 'pending',
    message,
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
  });
}

export async function getPendingRequests(groupId) {
  const snap = await getDocs(
    query(
      collection(db, 'groupJoinRequests'),
      where('groupId', '==', groupId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc'),
    ),
  );
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function reviewJoinRequest(requestId, status, reviewedBy) {
  const requestRef = doc(db, 'groupJoinRequests', requestId);
  const requestSnap = await getDoc(requestRef);
  if (!requestSnap.exists()) throw new Error('Request not found.');

  await updateDoc(requestRef, {
    status,
    reviewedAt: serverTimestamp(),
    reviewedBy,
  });

  if (status === 'approved') {
    const { userId, groupId } = requestSnap.data();
    const groupSnap = await getDoc(doc(db, 'groups', groupId));
    const g = groupSnap.exists() ? groupSnap.data() : {};

    // The requester may have become leader/co-leader (via a claim code) while
    // this request was pending — in that case they're already in the group
    // with a higher role, so don't add them as a regular member.
    const alreadyLeader = g.leaderId === userId || (g.coLeaderIds || []).includes(userId);
    const memberIds = g.memberIds || [];
    if (!alreadyLeader && !memberIds.includes(userId)) {
      await updateDoc(doc(db, 'users', userId), { groupId, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, 'groups', groupId), {
        memberIds: [...memberIds, userId],
        updatedAt: serverTimestamp(),
      });
    }
  }
}

async function getMemberIds(groupId) {
  const snap = await getDoc(doc(db, 'groups', groupId));
  return snap.exists() ? (snap.data().memberIds || []) : [];
}

export async function claimLeaderCode(code, userId) {
  const snap = await getDocs(
    query(
      collection(db, 'leaderClaimCodes'),
      where('code', '==', code),
      where('isUsed', '==', false),
    ),
  );
  if (snap.empty) throw new Error('Invalid or already used code.');

  const codeDoc = snap.docs[0];
  const { groupId, role } = codeDoc.data();

  await updateDoc(codeDoc.ref, {
    isUsed: true,
    usedBy: userId,
    usedAt: serverTimestamp(),
  });

  // leaderClaimCodeId lets the security rules verify this role change:
  // the referenced code doc must already be marked usedBy this user.
  await updateDoc(doc(db, 'users', userId), {
    role,
    groupId,
    leaderClaimCode: code,
    leaderClaimCodeId: codeDoc.id,
    updatedAt: serverTimestamp(),
  });

  // add to group leader/coLeader fields — and drop them from memberIds so a
  // previously-approved membership doesn't leave them listed twice
  const groupSnap = await getDoc(doc(db, 'groups', groupId));
  if (groupSnap.exists()) {
    const groupData = groupSnap.data();
    const memberIds = (groupData.memberIds || []).filter(uid => uid !== userId);
    if (role === 'leader') {
      await updateDoc(doc(db, 'groups', groupId), {
        leaderId: userId,
        memberIds,
        updatedAt: serverTimestamp(),
      });
    } else if (role === 'coLeader') {
      const coLeaderIds = groupData.coLeaderIds || [];
      await updateDoc(doc(db, 'groups', groupId), {
        coLeaderIds: coLeaderIds.includes(userId) ? coLeaderIds : [...coLeaderIds, userId],
        memberIds,
        updatedAt: serverTimestamp(),
      });
    }
  }

  // void any join requests still pending from this user for this group —
  // approving them later would have re-added the leader as a member
  try {
    const pending = await getDocs(
      query(
        collection(db, 'groupJoinRequests'),
        where('userId', '==', userId),
        where('groupId', '==', groupId),
        where('status', '==', 'pending'),
      ),
    );
    await Promise.all(
      pending.docs.map(d =>
        updateDoc(d.ref, { status: 'cancelled', reviewedAt: serverTimestamp(), reviewedBy: userId }),
      ),
    );
  } catch (e) {
    console.warn('Could not cancel pending join requests:', e);
  }

  return { groupId, role };
}

export async function getDiscipleshipRelations(groupId) {
  const snap = await getDocs(
    query(collection(db, 'discipleshipRelations'), where('groupId', '==', groupId)),
  );
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}
