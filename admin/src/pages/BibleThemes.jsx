import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';
import Modal, { FormField, adminInput } from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import explainError from '../utils/explainError';

const BLANK = {
  title: '', subtitle: '', scriptureReference: '', scriptureText: '',
  description: '', imageURL: '', startDate: '', endDate: '', isActive: false,
};

export default function BibleThemesPage() {
  const [themes, setThemes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const snap = await getDocs(collection(db, 'bibleThemes'));
    setThemes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(BLANK); setShowModal(true); }
  function openEdit(t) { setEditing(t.id); setForm({ ...t }); setShowModal(true); }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.title.trim()) { alert('Title is required.'); return; }
    setSaving(true);
    try {
      // strip the row id so it never gets stored as a document field
      const { id: _id, ...fields } = form;
      const data = { ...fields, updatedAt: serverTimestamp() };
      if (editing) {
        await updateDoc(doc(db, 'bibleThemes', editing), data);
      } else {
        await addDoc(collection(db, 'bibleThemes'), { ...data, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      await load();
    } catch (e) {
      alert(explainError(e, 'save'));
    } finally { setSaving(false); }
  }

  const columns = [
    { key: 'imageURL', label: 'Image', width: 90, render: r => r.imageURL
      ? <img src={r.imageURL} alt="" style={{ width: 70, height: 40, objectFit: 'cover', borderRadius: 6 }} />
      : <span style={{ color: '#A0A0A0', fontSize: 12 }}>—</span>
    },
    { key: 'title', label: 'Title' },
    { key: 'scriptureReference', label: 'Reference' },
    { key: 'isActive', label: 'Status', render: r => r.isActive
      ? <span style={{ color: '#4CAF7D', fontWeight: 700 }}>● Active</span>
      : <span style={{ color: '#A0A0A0' }}>Inactive</span>
    },
    { key: 'startDate', label: 'Period', render: r => `${r.startDate || '—'} → ${r.endDate || '—'}` },
    { key: '_', label: 'Actions', render: r => (
      <button onClick={() => openEdit(r)} style={{ padding: '4px 12px', background: '#EDD9B8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#8F5520' }}>
        Edit
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Bible Themes"
        subtitle="Manage the current and past Bible themes shown in the app."
        action={{ label: '+ New Theme', onClick: openCreate }}
      />
      <AdminTable columns={columns} rows={themes} emptyLabel="No Bible themes yet." />

      {showModal && (
        <Modal
          title={editing ? 'Edit Bible Theme' : 'New Bible Theme'}
          onClose={() => setShowModal(false)}
          onConfirm={handleSave}
          loading={saving}
        >
          <ImageUpload
            label="Theme Background Image (optional)"
            aspect="Recommended: 16:9 landscape"
            storagePath="bible-themes"
            value={form.imageURL}
            onChange={url => set('imageURL', url)}
          />
          <FormField label="Title">
            <input style={adminInput} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Abide in the Vine" />
          </FormField>
          <FormField label="Subtitle">
            <input style={adminInput} value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="e.g. Living in Union with Christ" />
          </FormField>
          <FormField label="Scripture Reference">
            <input style={adminInput} value={form.scriptureReference} onChange={e => set('scriptureReference', e.target.value)} placeholder="e.g. John 15:5" />
          </FormField>
          <FormField label="Scripture Text">
            <textarea
              style={{ ...adminInput, height: 80, resize: 'vertical' }}
              value={form.scriptureText}
              onChange={e => set('scriptureText', e.target.value)}
              placeholder="The full verse text…"
            />
          </FormField>
          <FormField label="Reflection / Description">
            <textarea
              style={{ ...adminInput, height: 120, resize: 'vertical' }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Devotional content for this theme…"
            />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Start Date">
              <input style={adminInput} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </FormField>
            <FormField label="End Date">
              <input style={adminInput} type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Status">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: form.isActive ? '#D4EEE0' : '#F5F1EC', borderRadius: 10, border: `1.5px solid ${form.isActive ? '#4CAF7D' : '#E8E2D9'}`, transition: 'all 0.15s' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => set('isActive', e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                {form.isActive ? '● Set as Active Theme' : 'Mark as Active Theme'}
              </span>
              <span style={{ fontSize: 12, color: '#6B6B6B', marginLeft: 'auto' }}>Only 1 should be active</span>
            </label>
          </FormField>
        </Modal>
      )}
    </div>
  );
}
