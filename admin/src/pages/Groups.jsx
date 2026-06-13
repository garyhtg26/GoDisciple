import React, { useState, useEffect } from 'react';
import { Cross, Users, UserMinus, X } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import AdminTable from '../components/AdminTable';
import Modal, { FormField, adminInput } from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import explainError from '../utils/explainError';

const BLANK = { name: '', description: '', location: '', ageRange: '', meetingSchedule: '', logoURL: '', coverURL: '' };

// ── Members detail modal ──────────────────────────────────────────────────────
function MemberRow({ user, badge, badgeColor, onRemove, removing }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0', borderBottom: '1px solid #EDEDED',
    }}>
      {user.photoURL
        ? <img src={user.photoURL} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{
            width: 34, height: 34, borderRadius: '50%', background: '#EBEBEB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#555',
          }}>
            {(user.fullName || user.email || '?').charAt(0).toUpperCase()}
          </div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0D0D0D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.fullName || '—'}
        </div>
        <div style={{ fontSize: 12, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email}
        </div>
      </div>
      {badge && (
        <span style={{
          background: badgeColor || '#EBEBEB', padding: '2px 8px', borderRadius: 4,
          fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5,
          flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
      <button
        onClick={onRemove}
        disabled={removing}
        title="Remove from group"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
          padding: '5px 10px', background: '#FFF0F0', border: '1px solid #E05252',
          borderRadius: 6, cursor: removing ? 'default' : 'pointer',
          fontSize: 12, fontWeight: 600, color: '#E05252', opacity: removing ? 0.5 : 1,
        }}
      >
        <UserMinus size={12} />
        {removing ? '…' : 'Remove'}
      </button>
    </div>
  );
}

function MembersModal({ group, users, onClose, onChanged }) {
  const [removing, setRemoving] = useState(null);

  const byId = uid => users.find(u => u.id === uid);
  const leader = group.leaderId ? byId(group.leaderId) : null;
  const coLeaders = (group.coLeaderIds || []).map(byId).filter(Boolean);
  const coIds = group.coLeaderIds || [];
  const members = (group.memberIds || [])
    .filter(uid => !coIds.includes(uid) && uid !== group.leaderId)
    .map(byId).filter(Boolean);

  async function remove(user, kind) {
    const label = kind === 'leader' ? 'LEADER' : kind === 'coLeader' ? 'co-leader' : 'member';
    if (!confirm(`Remove ${user.fullName || user.email} (${label}) from "${group.name}"? They will become a regular member with no group.`)) return;
    setRemoving(user.id);
    try {
      // detach + demote the user
      await updateDoc(doc(db, 'users', user.id), { role: 'member', groupId: null, updatedAt: serverTimestamp() });
      // update the group doc
      const updates = { updatedAt: serverTimestamp() };
      if (kind === 'leader') updates.leaderId = null;
      if (kind === 'coLeader') updates.coLeaderIds = coIds.filter(uid => uid !== user.id);
      updates.memberIds = (group.memberIds || []).filter(uid => uid !== user.id);
      await updateDoc(doc(db, 'groups', group.id), updates);
      await onChanged();
    } catch (e) {
      alert(explainError(e, 'remove'));
    } finally { setRemoving(null); }
  }

  const total = (leader ? 1 : 0) + coLeaders.length + members.length;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 480, maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: '#F0F0F0', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        ><X size={16} /></button>

        <div style={{ fontSize: 18, fontWeight: 700, color: '#0D0D0D' }}>{group.name}</div>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 18 }}>{total} {total === 1 ? 'person' : 'people'} in this group</div>

        {leader && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Leader</div>
            <MemberRow
              user={leader}
              badge="Leader"
              badgeColor="#F8EDD4"
              removing={removing === leader.id}
              onRemove={() => remove(leader, 'leader')}
            />
          </>
        )}

        {coLeaders.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 4px' }}>Co-Leaders</div>
            {coLeaders.map(u => (
              <MemberRow
                key={u.id}
                user={u}
                badge="Co-Leader"
                badgeColor="#D4E8F8"
                removing={removing === u.id}
                onRemove={() => remove(u, 'coLeader')}
              />
            ))}
          </>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 4px' }}>
          Members ({members.length})
        </div>
        {members.length === 0
          ? <div style={{ fontSize: 13, color: '#AAA', padding: '10px 0' }}>No regular members.</div>
          : members.map(u => (
            <MemberRow
              key={u.id}
              user={u}
              removing={removing === u.id}
              onRemove={() => remove(u, 'member')}
            />
          ))}
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [membersGroup, setMembersGroup] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [gSnap, uSnap] = await Promise.all([
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'users')),
    ]);
    const g = gSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    setGroups(g);
    setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    // keep the members modal in sync after a removal
    setMembersGroup(prev => prev ? g.find(x => x.id === prev.id) || null : null);
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
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setMembersGroup(r)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', background: '#0D0D0D', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          <Users size={13} />
          Members
        </button>
        <button onClick={() => openEdit(r)} style={{ padding: '4px 10px', background: '#EBEBEB', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#0D0D0D' }}>
          Edit
        </button>
      </div>
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

      {membersGroup && (
        <MembersModal
          group={membersGroup}
          users={users}
          onClose={() => setMembersGroup(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
