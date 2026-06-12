import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';
import Modal, { FormField, adminInput } from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import explainError from '../utils/explainError';

const BLANK = { title: '', imageURL: '', order: 1 };

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const snap = await getDocs(query(collection(db, 'banners'), orderBy('order', 'asc')));
    setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(BLANK); setShowModal(true); }
  function openEdit(b) { setEditing(b.id); setForm({ ...b }); setShowModal(true); }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.imageURL) { alert('Please upload or provide an image.'); return; }
    setSaving(true);
    try {
      const { id: _id, ...fields } = form;
      if (editing) {
        await updateDoc(doc(db, 'banners', editing), fields);
      } else {
        await addDoc(collection(db, 'banners'), { ...fields, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      await load();
    } catch (e) {
      alert(explainError(e, 'save'));
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this banner?')) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
      await load();
    } catch (e) {
      alert(explainError(e, 'delete'));
    }
  }

  const columns = [
    { key: 'order', label: '#', width: 50 },
    { key: 'imageURL', label: 'Image', render: r => r.imageURL
      ? <img src={r.imageURL} alt="" style={{ width: 100, height: 50, objectFit: 'cover', borderRadius: 6 }} />
      : '—'
    },
    { key: 'title', label: 'Title' },
    { key: '_', label: '', render: r => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => openEdit(r)} style={{ padding: '4px 10px', background: '#EDD9B8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#8F5520' }}>Edit</button>
        <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 10px', background: '#FFF0F0', border: '1px solid #E05252', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#E05252' }}>Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Home Banners"
        subtitle="Manage the hero banners shown on the Home screen."
        action={{ label: '+ Add Banner', onClick: openCreate }}
      />
      <AdminTable columns={columns} rows={banners} emptyLabel="No banners yet." />

      {showModal && (
        <Modal
          title={editing ? 'Edit Banner' : 'New Banner'}
          onClose={() => setShowModal(false)}
          onConfirm={handleSave}
          loading={saving}
        >
          <ImageUpload
            label="Banner Image"
            aspect="Recommended: 16:9 · min 800px wide"
            storagePath="banners"
            value={form.imageURL}
            onChange={url => set('imageURL', url)}
          />
          <FormField label="Title (optional)">
            <input
              style={adminInput}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Welcome to Go Disciple"
            />
          </FormField>
          <FormField label="Display Order">
            <input
              style={adminInput}
              type="number"
              min={1}
              value={form.order}
              onChange={e => set('order', parseInt(e.target.value) || 1)}
            />
          </FormField>
        </Modal>
      )}
    </div>
  );
}
