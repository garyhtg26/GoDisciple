import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';
import Modal, { FormField, adminInput } from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import explainError from '../utils/explainError';

const BLANK = { title: '', type: 'service', description: '', location: '', startDateTime: '', endDateTime: '', isPublic: true, groupId: '', posterURL: '' };
const TYPES = ['service', 'group', 'event', 'training'];

function toInputDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 16);
}

export default function SchedulesPage() {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const snap = await getDocs(query(collection(db, 'schedules'), orderBy('startDateTime', 'asc')));
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }
  useEffect(() => {
    load();
    getDocs(collection(db, 'groups')).then(snap =>
      setGroups(snap.docs.map(d => ({ id: d.id, name: d.data().name }))),
    );
  }, []);

  function openCreate() { setEditing(null); setForm(BLANK); setShowModal(true); }
  function openEdit(i) { setEditing(i.id); setForm({ ...i, startDateTime: toInputDate(i.startDateTime), endDateTime: toInputDate(i.endDateTime) }); setShowModal(true); }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.startDateTime) { alert('Start date is required.'); return; }
    if (!form.isPublic && !form.groupId) { alert('Pick a group for a group-only schedule.'); return; }
    setSaving(true);
    try {
      const { id: _id, ...fields } = form;
      const data = {
        ...fields,
        groupId: form.isPublic ? null : form.groupId,
        startDateTime: Timestamp.fromDate(new Date(form.startDateTime)),
        endDateTime: form.endDateTime ? Timestamp.fromDate(new Date(form.endDateTime)) : null,
      };
      if (editing) {
        await updateDoc(doc(db, 'schedules', editing), data);
      } else {
        await addDoc(collection(db, 'schedules'), { ...data, createdBy: 'admin', createdAt: serverTimestamp() });
      }
      setShowModal(false); await load();
    } catch (e) {
      alert(explainError(e, 'save'));
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this schedule?')) return;
    try {
      await deleteDoc(doc(db, 'schedules', id));
      await load();
    } catch (e) {
      alert(explainError(e, 'delete'));
    }
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const TYPE_COLOR = { service: '#D4E8F8', group: '#D4EEE0', event: '#EDD9B8', training: '#F0EAD4' };
  const columns = [
    { key: 'posterURL', label: 'Poster', width: 70, render: r => r.posterURL
      ? <img src={r.posterURL} alt="" style={{ width: 44, height: 55, objectFit: 'cover', borderRadius: 6 }} />
      : <span style={{ color: '#A0A0A0', fontSize: 12 }}>—</span>
    },
    { key: 'type', label: 'Type', render: r => <span style={{ background: TYPE_COLOR[r.type] || '#eee', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{r.type}</span> },
    { key: 'title', label: 'Title' },
    { key: 'startDateTime', label: 'Date', render: r => fmtDate(r.startDateTime) },
    { key: 'location', label: 'Location' },
    { key: 'isPublic', label: 'Visibility', render: r => r.isPublic !== false
      ? <span style={{ color: '#1A7A4A', fontSize: 12, fontWeight: 600 }}>Public</span>
      : <span style={{ background: '#EBEBEB', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#555' }}>
          {groups.find(g => g.id === r.groupId)?.name || 'Group'}
        </span>
    },
    { key: '_', label: '', render: r => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => openEdit(r)} style={{ padding: '4px 10px', background: '#EDD9B8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#8F5520' }}>Edit</button>
        <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 10px', background: '#FFF0F0', border: '1px solid #E05252', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#E05252' }}>Del</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Schedules" subtitle="Manage church services, events, and group meetings." action={{ label: '+ New Schedule', onClick: openCreate }} />
      <AdminTable columns={columns} rows={items} emptyLabel="No schedules yet." />
      {showModal && (
        <Modal title={editing ? 'Edit Schedule' : 'New Schedule'} onClose={() => setShowModal(false)} onConfirm={handleSave} loading={saving}>
          <ImageUpload
            label="Event Poster (optional)"
            aspect="Recommended: Instagram post ratio 4:5 or 1:1"
            storagePath="schedules"
            value={form.posterURL}
            onChange={url => set('posterURL', url)}
          />
          <FormField label="Title"><input style={adminInput} value={form.title} onChange={e => set('title', e.target.value)} /></FormField>
          <FormField label="Type">
            <select style={adminInput} value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Description"><textarea style={{ ...adminInput, height: 80 }} value={form.description} onChange={e => set('description', e.target.value)} /></FormField>
          <FormField label="Location"><input style={adminInput} value={form.location} onChange={e => set('location', e.target.value)} /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Start"><input style={adminInput} type="datetime-local" value={form.startDateTime} onChange={e => set('startDateTime', e.target.value)} /></FormField>
            <FormField label="End"><input style={adminInput} type="datetime-local" value={form.endDateTime} onChange={e => set('endDateTime', e.target.value)} /></FormField>
          </div>
          <FormField label="Visibility">
            <select
              style={adminInput}
              value={form.isPublic ? 'public' : 'group'}
              onChange={e => set('isPublic', e.target.value === 'public')}
            >
              <option value="public">Public — visible to all members</option>
              <option value="group">Group only — visible to one group</option>
            </select>
          </FormField>
          {!form.isPublic && (
            <FormField label="Group">
              <select style={adminInput} value={form.groupId || ''} onChange={e => set('groupId', e.target.value)}>
                <option value="">— Select group —</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </FormField>
          )}
        </Modal>
      )}
    </div>
  );
}
