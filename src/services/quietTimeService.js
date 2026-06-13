import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// One check-in document per user per day.
// Doc ID: `${userId}_${YYYY-MM-DD}` → makes a duplicate same-day check-in impossible.

/** Local YYYY-MM-DD (NOT UTC — toISOString would shift the day across timezones). */
export function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Tiers, highest first. A tier unlocks when the current streak reaches `days`. */
export const TIERS = [
  { key: 'godlike',   label: 'Godlike',   days: 365, color: '#7C3AED', blurb: 'Unbroken for a year. A living testimony.' },
  { key: 'steadfast', label: 'Steadfast', days: 100, color: '#B45309', blurb: '100 days rooted in His Word.' },
  { key: 'devoted',   label: 'Devoted',   days: 50,  color: '#1A7A4A', blurb: '50 days of faithful pursuit.' },
  { key: 'faithful',  label: 'Faithful',  days: 10,  color: '#2563EB', blurb: '10 days — a habit is forming.' },
  { key: 'seedling',  label: 'Seedling',  days: 1,   color: '#6B7280', blurb: 'The journey begins.' },
];

/** Highest tier reached for a given streak length (returns null if streak is 0). */
export function tierForStreak(streak) {
  if (!streak || streak < 1) return null;
  return TIERS.find(t => streak >= t.days) || null;
}

/** The next tier above the current streak (null once Godlike is reached). */
export function nextTierForStreak(streak) {
  const ascending = [...TIERS].reverse(); // seedling → godlike
  return ascending.find(t => t.days > (streak || 0)) || null;
}

export async function getTodayCheckin(userId) {
  const id = `${userId}_${localDateStr()}`;
  const snap = await getDoc(doc(db, 'quietTimeCheckins', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function checkInQuietTime(userId, { book = '', note = '' } = {}) {
  const date = localDateStr();
  const id = `${userId}_${date}`;
  await setDoc(doc(db, 'quietTimeCheckins', id), {
    userId,
    date,
    book: book || null,
    note: note || null,
    createdAt: serverTimestamp(),
  });
  return { id, date, book };
}

/** All check-ins for a user, returned as a Set of 'YYYY-MM-DD' strings + raw docs. */
export async function getCheckinHistory(userId) {
  const snap = await getDocs(
    query(collection(db, 'quietTimeCheckins'), where('userId', '==', userId)),
  );
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const dateSet = new Set(docs.map(d => d.date).filter(Boolean));
  return { dateSet, docs };
}

/** Consecutive days ending today (or yesterday, so the streak isn't "lost" before today's check-in). */
export function computeCurrentStreak(dateSet, today = new Date()) {
  if (!dateSet || dateSet.size === 0) return 0;
  const cursor = new Date(today);
  // If today isn't checked in yet but yesterday is, start counting from yesterday.
  if (!dateSet.has(localDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dateSet.has(localDateStr(cursor))) return 0;
  }
  let streak = 0;
  while (dateSet.has(localDateStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Longest run of consecutive days in the whole history. */
export function computeLongestStreak(dateSet) {
  if (!dateSet || dateSet.size === 0) return 0;
  const sorted = [...dateSet].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  return longest;
}

/** Everything the Quiet Time screen needs in one call. */
export async function getQuietTimeStats(userId) {
  const { dateSet, docs } = await getCheckinHistory(userId);
  const currentStreak = computeCurrentStreak(dateSet);
  const longestStreak = computeLongestStreak(dateSet);
  const today = localDateStr();
  return {
    dateSet,
    docs,
    currentStreak,
    longestStreak,
    totalDays: dateSet.size,
    checkedInToday: dateSet.has(today),
    tier: tierForStreak(currentStreak),
    nextTier: nextTierForStreak(currentStreak),
  };
}
