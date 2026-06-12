import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';
import explainError from '../utils/explainError';

const ROLES = ['member', 'leader', 'coLeader', 'admin'];
const ROLE_COLOR = { admin: '#F0D4D4', leader: '#D4E8D4', coLeader: '#D4E0F0', member: '#E8E2D9' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  async function load() {
    const [uSnap, gSnap] = await Promise.all([getDocs(collection(db, 'users')), getDocs(collection(db, 'groups'))]);
    const g = {}; gSnap.docs.forEach(d => { g[d.id] = d.data(); });
    setGroups(g);
    setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleRoleChange(userId, newRole) {
    if (!confirm(`Change this user's role to "${newRole}"?`)) return;
    setUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      await load();
    } catch (e) {
      alert(explainError(e, 'update'));
    } finally { setUpdating(null); }
  }

  const columns = [
    { key: 'fullName', label: 'Name', render: r => <strong>{r.fullName || '—'}</strong> },
    { key: 'email', label: 'Email', render: r => <span style={{ color: '#6B6B6B', fontSize: 13 }}>{r.email}</span> },
    { key: 'role', label: 'Role', render: r => (
      <select
        value={r.role || 'member'}
        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E8E2D9', background: ROLE_COLOR[r.role] || '#eee', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
        onChange={e => handleRoleChange(r.id, e.target.value)}
        disabled={updating === r.id}
      >
        {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
      </select>
    )},
    { key: 'groupId', label: 'Group', render: r => r.groupId ? (groups[r.groupId]?.name || r.groupId) : '—' },
    { key: 'phone', label: 'Phone', render: r => r.phone || '—' },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} registered members.`} />
      {loading ? <p>Loading…</p> : <AdminTable columns={columns} rows={users} emptyLabel="No users yet." />}
    </div>
  );
}
