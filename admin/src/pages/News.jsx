import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';
import Modal, { FormField, adminInput } from '../components/Modal';
import ImageUpload from '../components/ImageUpload';

const BLANK = { title: '', excerpt: '', imageURL: '', category: 'NEWS' };

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const snap = await getDocs(query(collection(db, 'news'), orderBy('createdAt', 'desc')));
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(BLANK); setShowModal(true); }
  function openEdit(item) { setEditing(item.id); setForm({ ...item }); setShowModal(true); }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.title.trim()) { alert('Title is required.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, 'news', editing), { ...form, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'news'), { ...form, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this news item?')) return;
    await deleteDoc(doc(db, 'news', id));
    await load();
  }

  const columns = [
    { key: 'imageURL', label: 'Image', width: 100, render: r => r.imageURL
      ? <img src={r.imageURL} alt="" style={{ width: 80, height: 44, objectFit: 'cover', borderRadius: 6 }} />
      : <span style={{ color: '#A0A0A0', fontSize: 12 }}>No image</span>
    },
    { key: 'category', label: 'Tag', render: r => (
      <span style={{ background: '#EDD9B8', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#8F5520' }}>
        {r.category}
      </span>
    )},
    { key: 'title', label: 'Title' },
    { key: 'excerpt', label: 'Excerpt', render: r => (
      <span style={{ color: '#6B6B6B' }}>
        {(r.excerpt || '').slice(0, 60)}{(r.excerpt || '').length > 60 ? '…' : ''}
      </span>
    )},
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
        title="News"
        subtitle="Manage church news and announcements."
        action={{ label: '+ New Article', onClick: openCreate }}
      />
      <AdminTable columns={columns} rows={items} emptyLabel="No news articles yet." />

      {showModal && (
        <Modal
          title={editing ? 'Edit Article' : 'New Article'}
          onClose={() => setShowModal(false)}
          onConfirm={handleSave}
          loading={saving}
        >
          <FormField label="Category">
            <input
              style={adminInput}
              value={form.category}
              onChange={e => set('category', e.target.value)}
              placeholder="e.g. NEWS, ANNOUNCEMENT, BIBLE STUDY"
            />
          </FormField>
          <FormField label="Title">
            <input style={adminInput} value={form.title} onChange={e => set('title', e.target.value)} />
          </FormField>
          <FormField label="Excerpt / Summary">
            <textarea
              style={{ ...adminInput, height: 80, resize: 'vertical' }}
              value={form.excerpt}
              onChange={e => set('excerpt', e.target.value)}
              placeholder="Short description shown on the card…"
            />
          </FormField>
          <ImageUpload
            label="Cover Image (optional)"
            aspect="Recommended: 16:9"
            storagePath="news"
            value={form.imageURL}
            onChange={url => set('imageURL', url)}
          />
        </Modal>
      )}
    </div>
  );
}
