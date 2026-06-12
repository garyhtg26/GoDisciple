import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';
import Modal, { FormField, adminInput } from '../components/Modal';

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'LEAD-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function LeaderCodesPage() {
  const [codes, setCodes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: generateCode(), groupId: '', role: 'leader' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDocs(collection(db, 'leaderClaimCodes')).then(s => setCodes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    getDocs(collection(db, 'groups')).then(s => setGroups(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  async function handleCreate() {
    if (!form.groupId) { alert('Select a group.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'leaderClaimCodes'), {
        code: form.code.toUpperCase(),
        groupId: form.groupId,
        role: form.role,
        isUsed: false,
        usedBy: null,
        usedAt: null,
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      setForm({ code: generateCode(), groupId: '', role: 'leader' });
      const snap = await getDocs(collection(db, 'leaderClaimCodes'));
      setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'code', label: 'Code', render: r => <code style={{ background: '#EDD9B8', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{r.code}</code> },
    { key: 'role', label: 'Role', render: r => r.role === 'leader' ? 'Leader' : 'Co-Leader' },
    { key: 'groupId', label: 'Group', render: r => groups.find(g => g.id === r.groupId)?.name || r.groupId },
    { key: 'isUsed', label: 'Status', render: r => r.isUsed
      ? <span style={{ color: '#6B6B6B' }}>Used</span>
      : <span style={{ color: '#4CAF7D', fontWeight: 600 }}>Available</span>
    },
    { key: 'usedBy', label: 'Used By', render: r => r.usedBy || '—' },
  ];

  return (
    <div>
      <PageHeader title="Leader Claim Codes" subtitle="Generate codes for leaders to claim their role via the mobile app." action={{ label: '+ Generate Code', onClick: () => setShowModal(true) }} />
      <AdminTable columns={columns} rows={codes} emptyLabel="No codes generated yet." />

      {showModal && (
        <Modal title="Generate Leader Code" onClose={() => setShowModal(false)} onConfirm={handleCreate} confirmLabel="Generate" loading={saving}>
          <FormField label="Code">
            <input style={adminInput} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
          </FormField>
          <FormField label="Role">
            <select style={adminInput} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="leader">Group Leader</option>
              <option value="coLeader">Co-Leader</option>
            </select>
          </FormField>
          <FormField label="Assign to Group">
            <select style={adminInput} value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}>
              <option value="">— Select a group —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </FormField>
        </Modal>
      )}
    </div>
  );
}
