import React, { useState, useEffect } from 'react';
import { Cross } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';
import Modal, { FormField, adminInput } from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import explainError from '../utils/explainError';

const BLANK = { name: '', description: '', location: '', ageRange: '', meetingSchedule: '', logoURL: '', coverURL: '' };

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const snap = await getDocs(collection(db, 'groups'));
    setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(BLANK); setShowModal(true); }
  function openEdit(g) {
    setEditing(g.id);
    setForm({ name: g.name || '', description: g.description || '', location: g.location || '', ageRange: g.ageRange || '', meetingSchedule: g.meetingSchedule || '', logoURL: g.logoURL || '', coverURL: g.coverURL || '' });
    setShowModal(true);
  }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.name.trim()) { alert('Group name is required.'); return; }
    setSaving(true);
    try {
      const { id: _id, ...fields } = form;
      if (editing) {
        await updateDoc(doc(db, 'groups', editing), { ...fields, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'groups'), {
          ...fields,
          leaderId: null,
          coLeaderIds: [],
          memberIds: [],
          socials: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setShowModal(false);
      await load();
    } catch (e) {
      alert(explainError(e, 'save'));
    } finally { setSaving(false); }
  }

  const columns = [
    { key: 'logoURL', label: 'Logo', width: 70, render: r => r.logoURL
      ? <img src={r.logoURL} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10 }} />
      : <div style={{ width: 44, height: 44, background: '#EBEBEB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Cross size={20} color="#555" /></div>
    },
    { key: 'name', label: 'Group Name', render: r => <strong>{r.name}</strong> },
    { key: 'location', label: 'Location' },
    { key: 'ageRange', label: 'Age Range' },
    { key: 'memberIds', label: 'Members', render: r => (r.memberIds || []).length },
    { key: '_', label: '', render: r => (
      <button onClick={() => openEdit(r)} style={{ padding: '4px 10px', background: '#EDD9B8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#8F5520' }}>
        Edit
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Groups"
        subtitle="Manage discipleship groups."
        action={{ label: '+ New Group', onClick: openCreate }}
      />
      <AdminTable columns={columns} rows={groups} emptyLabel="No groups yet." />

      {showModal && (
        <Modal
          title={editing ? 'Edit Group' : 'New Group'}
          onClose={() => setShowModal(false)}
          onConfirm={handleSave}
          loading={saving}
        >
          <ImageUpload
            label="Group Logo (optional)"
            aspect="Square recommended · 1:1"
            storagePath="group-logos"
            value={form.logoURL}
            onChange={url => set('logoURL', url)}
          />
          <ImageUpload
            label="Cover / Background Photo (optional)"
            aspect="Landscape recommended · 16:10"
            storagePath="group-covers"
            value={form.coverURL}
            onChange={url => set('coverURL', url)}
            emptyPreview
          />
          <FormField label="Group Name">
            <input style={adminInput} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Kelompok Kecil Alpha" />
          </FormField>
          <FormField label="Description">
            <textarea style={{ ...adminInput, height: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What is this group about?" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Location">
              <input style={adminInput} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Jakarta Selatan" />
            </FormField>
            <FormField label="Age Range">
              <input style={adminInput} value={form.ageRange} onChange={e => set('ageRange', e.target.value)} placeholder="e.g. 20-30" />
            </FormField>
          </div>
          <FormField label="Meeting Schedule">
            <input style={adminInput} value={form.meetingSchedule} onChange={e => set('meetingSchedule', e.target.value)} placeholder="e.g. Every Saturday, 7:00 PM" />
          </FormField>
        </Modal>
      )}
    </div>
  );
}
