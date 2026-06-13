import React, { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, query, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';
import Modal, { FormField, adminInput } from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import PdfUpload from '../components/PdfUpload';
import explainError from '../utils/explainError';

const CATEGORIES = ['Sermon', 'Bible Study', 'Prayer', 'Worship', 'Youth', 'Other'];

const BLANK = {
  title: '',
  speaker: '',
  category: 'Sermon',
  date: '',
  duration: '',
  thumbnailUrl: '',
  videoUrl: '',
  pdfUrl: '',
  description: '',
  isPublished: true,
};

function toInputDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 10);
}

function toTimestamp(str) {
  if (!str) return null;
  return Timestamp.fromDate(new Date(str));
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LessonsPage() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const snap = await getDocs(query(collection(db, 'lessons'), orderBy('date', 'desc')));
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(BLANK); setShowModal(true); }
  function openEdit(item) {
    setEditing(item.id);
    setForm({ ...item, date: toInputDate(item.date) });
    setShowModal(true);
  }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.title.trim()) { alert('Title is required.'); return; }
    setSaving(true);
    try {
      const { id: _id, ...fields } = form;
      const payload = {
        ...fields,
        date: toTimestamp(form.date),
        updatedAt: serverTimestamp(),
      };
      if (editing) {
        await updateDoc(doc(db, 'lessons', editing), payload);
      } else {
        await addDoc(collection(db, 'lessons'), { ...payload, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      await load();
    } catch (e) {
      alert(explainError(e, 'save'));
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this lesson?')) return;
    try {
      await deleteDoc(doc(db, 'lessons', id));
      await load();
    } catch (e) {
      alert(explainError(e, 'delete'));
    }
  }

  async function togglePublish(item) {
    await updateDoc(doc(db, 'lessons', item.id), { isPublished: !item.isPublished, updatedAt: serverTimestamp() });
    await load();
  }

  const columns = [
    {
      key: 'thumbnailUrl', label: 'Thumbnail', width: 100,
      render: r => r.thumbnailUrl
        ? <img src={r.thumbnailUrl} alt="" style={{ width: 80, height: 48, objectFit: 'cover', borderRadius: 6 }} />
        : <span style={{ color: '#A0A0A0', fontSize: 12 }}>No image</span>,
    },
    {
      key: 'category', label: 'Category',
      render: r => (
        <span style={{ background: '#EBEBEB', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#444' }}>
          {r.category}
        </span>
      ),
    },
    { key: 'title', label: 'Title' },
    { key: 'speaker', label: 'Speaker', render: r => <span style={{ color: '#6B6B6B' }}>{r.speaker || '—'}</span> },
    { key: 'date', label: 'Date', render: r => <span style={{ color: '#6B6B6B', fontSize: 12 }}>{fmtDate(r.date)}</span> },
    { key: 'duration', label: 'Duration', render: r => <span style={{ color: '#6B6B6B', fontSize: 12 }}>{r.duration || '—'}</span> },
    {
      key: 'isPublished', label: 'Status',
      render: r => (
        <button
          onClick={() => togglePublish(r)}
          style={{
            padding: '3px 10px', border: 'none', borderRadius: 4, cursor: 'pointer',
            fontSize: 11, fontWeight: 700,
            background: r.isPublished ? '#D4EDDA' : '#F0F0F0',
            color: r.isPublished ? '#1A7A4A' : '#888',
          }}
        >
          {r.isPublished ? 'Published' : 'Draft'}
        </button>
      ),
    },
    {
      key: '_', label: '',
      render: r => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => openEdit(r)} style={{ padding: '4px 10px', background: '#EBEBEB', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#0D0D0D' }}>Edit</button>
          <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 10px', background: '#FFF0F0', border: '1px solid #E05252', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#E05252' }}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Lessons"
        subtitle="Manage sermons, bible studies, and other teaching materials."
        action={{ label: '+ New Lesson', onClick: openCreate }}
      />
      <AdminTable columns={columns} rows={items} emptyLabel="No lessons yet. Add your first lesson." />

      {showModal && (
        <Modal
          title={editing ? 'Edit Lesson' : 'New Lesson'}
          onClose={() => setShowModal(false)}
          onConfirm={handleSave}
          loading={saving}
        >
          <FormField label="Title *">
            <input
              style={adminInput}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Choose Life"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Category">
              <select style={adminInput} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select style={adminInput} value={form.isPublished ? 'true' : 'false'} onChange={e => set('isPublished', e.target.value === 'true')}>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </FormField>
          </div>

          <FormField label="Speaker / Preacher">
            <input
              style={adminInput}
              value={form.speaker}
              onChange={e => set('speaker', e.target.value)}
              placeholder="e.g. Ps. John Doe"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Date">
              <input
                style={adminInput}
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </FormField>
            <FormField label="Duration">
              <input
                style={adminInput}
                value={form.duration}
                onChange={e => set('duration', e.target.value)}
                placeholder="e.g. 1 hr 30 mins"
              />
            </FormField>
          </div>

          <FormField label="Video URL (YouTube or other)">
            <input
              style={adminInput}
              value={form.videoUrl}
              onChange={e => set('videoUrl', e.target.value)}
              placeholder="https://youtu.be/..."
            />
          </FormField>

          <PdfUpload
            label="PDF Material (optional)"
            value={form.pdfUrl}
            onChange={url => set('pdfUrl', url)}
          />

          <ImageUpload
            label="Thumbnail Image"
            aspect="Recommended: 16:9"
            storagePath="lessons"
            value={form.thumbnailUrl}
            onChange={url => set('thumbnailUrl', url)}
          />

          <FormField label="Description / Notes">
            <textarea
              style={{ ...adminInput, height: 90, resize: 'vertical' }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Short description or key points…"
            />
          </FormField>
        </Modal>
      )}
    </div>
  );
}
