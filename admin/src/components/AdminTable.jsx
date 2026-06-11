import React from 'react';

const s = {
  wrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.8, backgroundColor: '#F5F1EC', borderBottom: '1px solid #E8E2D9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#1A1A1A', borderBottom: '1px solid #F0EBE3', verticalAlign: 'middle' },
  empty: { textAlign: 'center', color: '#A0A0A0', padding: '40px 0', fontSize: 14 },
};

export default function AdminTable({ columns, rows, emptyLabel = 'No records yet.' }) {
  return (
    <div style={s.wrapper}>
      <table style={s.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ ...s.th, width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={s.empty}>{emptyLabel}</td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key} style={s.td}>
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
