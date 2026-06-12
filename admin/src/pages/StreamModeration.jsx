import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';

function fmtTs(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

export default function StreamModerationPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const snap = await getDocs(query(collection(db, 'streamPosts'), orderBy('createdAt', 'desc')));
    setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    await deleteDoc(doc(db, 'streamPosts', id));
    await load();
  }

  const CAT_COLOR = { reflection: '#D4E8D4', testimony: '#D4E0F0', prayer: '#F0D4D4', announcement: '#F0EAD4', general: '#E8E2D9' };
  const columns = [
    { key: 'createdAt', label: 'Date', width: 90, render: r => fmtTs(r.createdAt) },
    { key: 'authorName', label: 'Author' },
    { key: 'category', label: 'Category', render: r => <span style={{ background: CAT_COLOR[r.category] || '#eee', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{r.category}</span> },
    { key: 'content', label: 'Content', render: r => <span style={{ color: '#3A3A3A' }}>{(r.content || '').slice(0, 100)}{(r.content || '').length > 100 ? '…' : ''}</span> },
    { key: 'likeCount', label: <Heart size={13} style={{ verticalAlign: 'middle' }} />, width: 50 },
    { key: 'commentCount', label: <MessageCircle size={13} style={{ verticalAlign: 'middle' }} />, width: 50 },
    { key: '_', label: '', render: r => (
      <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 10px', background: '#FFF0F0', border: '1px solid #E05252', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#E05252' }}>
        Remove
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Stream Posts" subtitle="Moderate public stream content." />
      {loading ? <p>Loading…</p> : <AdminTable columns={columns} rows={posts} emptyLabel="No stream posts yet." />}
    </div>
  );
}
