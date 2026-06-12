import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import {
  Users, UsersRound, Sparkles, CheckSquare, Calendar, ClipboardList,
} from 'lucide-react';
import { db } from '../firebase';

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#F0F0F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  count: { fontSize: 36, fontWeight: 700, color: '#0D0D0D', marginBottom: 4 },
  label: { fontSize: 14, color: '#6B6B6B', fontWeight: 500 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#0D0D0D' },
};

const STATS = [
  { key: 'users', label: 'Total Users', Icon: Users, col: 'users' },
  { key: 'groups', label: 'Groups', Icon: UsersRound, col: 'groups' },
  { key: 'streamPosts', label: 'Stream Posts', Icon: Sparkles, col: 'streamPosts' },
  { key: 'attendance', label: 'Attendance Records', Icon: CheckSquare, col: 'attendance' },
  { key: 'schedules', label: 'Schedules', Icon: Calendar, col: 'schedules' },
  { key: 'joinRequests', label: 'Join Requests', Icon: ClipboardList, col: 'groupJoinRequests' },
];

export default function DashboardPage() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    // Each count loads independently — one denied collection (e.g. when
    // signed in as a leader rather than admin) must not blank the others.
    STATS.forEach(async stat => {
      try {
        const snap = await getDocs(collection(db, stat.col));
        setCounts(prev => ({ ...prev, [stat.key]: snap.size }));
      } catch {
        setCounts(prev => ({ ...prev, [stat.key]: '—' }));
      }
    });
  }, []);

  return (
    <div>
      <div style={s.title}>Dashboard</div>
      <div style={s.grid}>
        {STATS.map(stat => (
          <div key={stat.key} style={s.card}>
            <div style={s.iconWrap}>
              <stat.Icon size={20} color="#0D0D0D" />
            </div>
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
