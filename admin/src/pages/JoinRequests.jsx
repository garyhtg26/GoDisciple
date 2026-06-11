import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';

function fmtTs(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function JoinRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState({});
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const [reqSnap, userSnap, groupSnap] = await Promise.all([
      getDocs(query(collection(db, 'groupJoinRequests'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'groups')),
    ]);
    const u = {}; userSnap.docs.forEach(d => { u[d.id] = d.data(); });
    const g = {}; groupSnap.docs.forEach(d => { g[d.id] = d.data(); });
    setUsers(u); setGroups(g);
    setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const STATUS_COLOR = { pending: '#F0EAD4', approved: '#D4EEE0', rejected: '#F0D4D4' };
  const columns = [
    { key: 'createdAt', label: 'Date', render: r => fmtTs(r.createdAt) },
    { key: 'userId', label: 'Member', render: r => users[r.userId]?.fullName || r.userId },
    { key: 'groupId', label: 'Group', render: r => groups[r.groupId]?.name || r.groupId },
    { key: 'status', label: 'Status', render: r => (
      <span style={{ background: STATUS_COLOR[r.status] || '#eee', padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
        {r.status}
      </span>
    )},
    { key: 'message', label: 'Message', render: r => r.message || '—' },
    { key: 'reviewedAt', label: 'Reviewed', render: r => fmtTs(r.reviewedAt) },
  ];

  return (
    <div>
      <PageHeader title="Join Requests" subtitle="Overview of all group join requests across the app." />
      {loading ? <p>Loading…</p> : <AdminTable columns={columns} rows={requests} emptyLabel="No join requests yet." />}
    </div>
  );
}
