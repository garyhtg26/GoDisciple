import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  count: { fontSize: 36, fontWeight: 700, color: '#C17A3A', marginBottom: 4 },
  label: { fontSize: 14, color: '#6B6B6B', fontWeight: 500 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
};

const STATS = [
  { key: 'users', label: 'Total Users', icon: '👤', col: 'users' },
  { key: 'groups', label: 'Groups', icon: '👥', col: 'groups' },
  { key: 'streamPosts', label: 'Stream Posts', icon: '✨', col: 'streamPosts' },
  { key: 'attendance', label: 'Attendance Records', icon: '✅', col: 'attendance' },
  { key: 'schedules', label: 'Schedules', icon: '📅', col: 'schedules' },
  { key: 'joinRequests', label: 'Join Requests', icon: '📋', col: 'groupJoinRequests' },
];

export default function DashboardPage() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    async function load() {
      const results = {};
      await Promise.all(
        STATS.map(async s => {
          const snap = await getDocs(collection(db, s.col));
          results[s.key] = snap.size;
        }),
      );
      setCounts(results);
    }
    load();
  }, []);

  return (
    <div>
      <div style={s.title}>Dashboard</div>
      <div style={s.grid}>
        {STATS.map(stat => (
          <div key={stat.key} style={s.card}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
            <div style={s.count}>{counts[stat.key] ?? '…'}</div>
            <div style={s.label}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Welcome to Go Disciple Admin</div>
        <p style={{ color: '#6B6B6B', fontSize: 14, lineHeight: 1.6 }}>
          Use the sidebar to manage your church app content, groups, attendance data, and more.
          All changes made here are instantly reflected in the mobile app.
        </p>
      </div>
    </div>
  );
}
