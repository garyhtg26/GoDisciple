import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';

function fmtTs(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState({});
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [attendSnap, userSnap, eventSnap] = await Promise.all([
        getDocs(query(collection(db, 'attendance'), orderBy('checkedInAt', 'desc'))),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'events')),
      ]);
      const u = {}; userSnap.docs.forEach(d => { u[d.id] = d.data(); });
      const e = {}; eventSnap.docs.forEach(d => { e[d.id] = d.data(); });
      setUsers(u);
      setEvents(e);
      setRecords(attendSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, []);

  const columns = [
    { key: 'checkedInAt', label: 'Check-in Time', render: r => fmtTs(r.checkedInAt) },
    { key: 'userId', label: 'Member', render: r => users[r.userId]?.fullName || r.userId },
    { key: 'eventId', label: 'Event', render: r => events[r.eventId]?.title || r.eventId },
    { key: 'method', label: 'Method', render: r => <span style={{ background: '#D4E8F8', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{r.method?.toUpperCase()}</span> },
    { key: 'groupId', label: 'Group', render: r => r.groupId || '—' },
  ];

  return (
    <div>
      <PageHeader title="Attendance" subtitle={`${records.length} total check-in records.`} />
      {loading ? <p>Loading…</p> : <AdminTable columns={columns} rows={records} emptyLabel="No attendance records yet." />}
    </div>
  );
}
