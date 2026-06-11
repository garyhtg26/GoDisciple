import React from 'react';

const s = {
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 700, color: '#1A1A1A' },
  sub: { fontSize: 13, color: '#6B6B6B', marginTop: 3 },
  btn: {
    padding: '10px 20px', backgroundColor: '#C17A3A', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  },
};

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={s.header}>
      <div>
        <div style={s.title}>{title}</div>
        {subtitle && <div style={s.sub}>{subtitle}</div>}
      </div>
      {action && (
        <button style={s.btn} onClick={action.onClick}>
          {action.icon && <span>{action.icon}</span>}
          {action.label}
        </button>
      )}
    </div>
  );
}
