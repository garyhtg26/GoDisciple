import React from 'react';

const s = {
  backdrop: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 32, width: 520,
    maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  cancel: {
    padding: '10px 20px', backgroundColor: '#F5F1EC', border: '1px solid #E8E2D9',
    borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500,
  },
  confirm: {
    padding: '10px 20px', backgroundColor: '#C17A3A', color: '#fff',
    border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
};

export default function Modal({ title, children, onClose, onConfirm, confirmLabel = 'Save', loading = false }) {
  return (
    <div style={s.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.title}>{title}</div>
        {children}
        <div style={s.footer}>
          <button style={s.cancel} onClick={onClose}>Cancel</button>
          <button style={s.confirm} onClick={onConfirm} disabled={loading}>
            {loading ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1A1A1A' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const adminInput = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #E8E2D9',
  borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
};
