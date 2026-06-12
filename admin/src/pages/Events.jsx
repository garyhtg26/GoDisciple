import React, { useState, useEffect, useRef } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, X } from 'lucide-react';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';
import Modal, { FormField, adminInput } from '../components/Modal';
import explainError from '../utils/explainError';

function generateCheckInCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function toInputDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 10);
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const BLANK = { title: '', date: '', location: '' };

// ── QR display modal ──────────────────────────────────────────────────────────
function QRModal({ event, onClose }) {
  const qrWrapRef = useRef(null);
  const payload = JSON.stringify({ eventId: event.id, checkInCode: event.checkInCode });

  function handleDownload() {
    const canvas = qrWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    // draw onto a larger canvas with white padding + title for printing
    const SIZE = 1000, PAD = 80;
    const out = document.createElement('canvas');
    out.width = SIZE;
    out.height = SIZE + 120;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, PAD, PAD, SIZE - PAD * 2, SIZE - PAD * 2);
    ctx.fillStyle = '#0D0D0D';
    ctx.font = 'bold 44px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(event.title || 'Check-in', SIZE / 2, SIZE + 20);
    ctx.font = '28px -apple-system, sans-serif';
    ctx.fillStyle = '#777';
    ctx.fillText(fmtDate(event.date), SIZE / 2, SIZE + 64);

    const a = document.createElement('a');
    a.download = `qr-${(event.title || 'event').replace(/\s+/g, '-').toLowerCase()}.png`;
    a.href = out.toDataURL('image/png');
    a.click();
  }

  return (
    <div style={qs.overlay} onClick={onClose}>
      <div style={qs.modal} onClick={e => e.stopPropagation()}>
        <button style={qs.closeBtn} onClick={onClose}><X size={18} /></button>
        <div style={qs.title}>{event.title}</div>
        <div style={qs.sub}>{fmtDate(event.date)}{event.location ? ` · ${event.location}` : ''}</div>
        <div ref={qrWrapRef} style={qs.qrBox}>
          <QRCodeCanvas value={payload} size={260} level="M" includeMargin />
        </div>
        <div style={qs.code}>Code: {event.checkInCode}</div>
        <button style={qs.dlBtn} onClick={handleDownload}>
          <Download size={15} />
          Download PNG
        </button>
        <div style={qs.hint}>
          Print or display this QR at the venue. Members scan it from the app's center QR button to check in.
        </div>
      </div>
    </div>
  );
}

const qs = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#fff', borderRadius: 20, padding: 32, width: 380,
    maxWidth: '92vw', textAlign: 'center', position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, background: '#F0F0F0',
    border: 'none', borderRadius: '50%', width: 32, height: 32,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: 700, color: '#0D0D0D', marginBottom: 4 },
  sub: { fontSize: 13, color: '#777', marginBottom: 20 },
  qrBox: {
    display: 'inline-block', padding: 16, background: '#fff',
    border: '1.5px solid #E2E2E2', borderRadius: 16, marginBottom: 14,
  },
  code: {
    fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#555',
    fontFamily: 'monospace', marginBottom: 18,
  },
  dlBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 22px', background: '#0D0D0D', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  hint: { fontSize: 12, color: '#999', lineHeight: 1.6, marginTop: 16 },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [qrEvent, setQrEvent] = useState(null);

  async function load() {
    const snap = await getDocs(query(collection(db, 'events'), orderBy('date', 'desc')));
    setItems(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(BLANK); setShowModal(true); }
  function openEdit(item) {
    setEditing(item.id);
    setForm({ title: item.title || '', date: toInputDate(item.date), location: item.location || '' });
    setShowModal(true);
  }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.title.trim()) { alert('Event title is required.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        location: form.location.trim(),
        date: form.date ? Timestamp.fromDate(new Date(form.date)) : null,
        updatedAt: serverTimestamp(),
      };
      if (editing) {
        await updateDoc(doc(db, 'events', editing), payload);
      } else {
        await addDoc(collection(db, 'events'), {
          ...payload,
          checkInCode: generateCheckInCode(),
          createdAt: serverTimestamp(),
        });
      }
      setShowModal(false);
      await load();
    } catch (e) {
      alert(explainError(e, 'save'));
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event? Its QR code will stop working.')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      await load();
    } catch {
      alert('Only admins can delete events.');
    }
  }

  const columns = [
    { key: 'title', label: 'Event' },
    { key: 'date', label: 'Date', render: r => <span style={{ color: '#6B6B6B', fontSize: 13 }}>{fmtDate(r.date)}</span> },
    { key: 'location', label: 'Location', render: r => <span style={{ color: '#6B6B6B', fontSize: 13 }}>{r.location || '—'}</span> },
    { key: 'checkInCode', label: 'Code', render: r => (
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#555' }}>
        {r.checkInCode}
      </span>
    )},
    { key: '_', label: '', render: r => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setQrEvent(r)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', background: '#0D0D0D', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          <QrCode size={13} />
          Show QR
        </button>
        <button onClick={() => openEdit(r)} style={{ padding: '4px 10px', background: '#EBEBEB', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#0D0D0D' }}>Edit</button>
        <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 10px', background: '#FFF0F0', border: '1px solid #E05252', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#E05252' }}>Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Check-in QR"
        subtitle="Create events and print their QR codes for attendance check-in."
        action={{ label: '+ New Event', onClick: openCreate }}
      />
      <AdminTable columns={columns} rows={items} emptyLabel="No events yet. Create one to generate its QR code." />

      {showModal && (
        <Modal
          title={editing ? 'Edit Event' : 'New Check-in Event'}
          onClose={() => setShowModal(false)}
          onConfirm={handleSave}
          loading={saving}
        >
          <FormField label="Event Title *">
            <input
              style={adminInput}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Ibadah Minggu — 15 June"
            />
          </FormField>
          <FormField label="Date">
            <input style={adminInput} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </FormField>
          <FormField label="Location">
            <input
              style={adminInput}
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Main Hall"
            />
          </FormField>
          {!editing && (
            <div style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>
              A unique check-in code is generated automatically. After saving, click <b>Show QR</b> to display or download the QR code.
            </div>
          )}
        </Modal>
      )}

      {qrEvent && <QRModal event={qrEvent} onClose={() => setQrEvent(null)} />}
    </div>
  );
}
