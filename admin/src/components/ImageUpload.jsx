import React, { useState } from 'react';

/**
 * ImageUpload — URL-only image input (no Firebase Storage required)
 * Paste any public image URL: Google Drive, Imgur, Unsplash, etc.
 */
export default function ImageUpload({ value, onChange, label = 'Image', aspect }) {
  const [input, setInput] = useState(value || '');
  const [error, setError] = useState('');

  function handleApply() {
    const url = input.trim();
    if (!url) { onChange(''); return; }

    // basic URL check
    try {
      new URL(url);
      setError('');
      onChange(url);
    } catch {
      setError('Please enter a valid URL starting with https://');
    }
  }

  function handleClear() {
    setInput('');
    onChange('');
    setError('');
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{label}</label>
        {aspect && <span style={{ fontSize: 11, color: '#A0A0A0' }}>{aspect}</span>}
      </div>

      {/* Preview */}
      {value && (
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <img
            src={value}
            alt="preview"
            onError={e => { e.target.style.display = 'none'; }}
            style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, border: '1.5px solid #E8E2D9', display: 'block' }}
          />
          <button
            onClick={handleClear}
            title="Remove image"
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              border: 'none', borderRadius: '50%',
              width: 28, height: 28, cursor: 'pointer',
              fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
      )}

      {/* URL input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{
            flex: 1, padding: '10px 14px',
            border: `1.5px solid ${error ? '#E05252' : '#E8E2D9'}`,
            borderRadius: 10, fontSize: 14, outline: 'none',
            color: '#1A1A1A', backgroundColor: '#FDFAF6',
          }}
          placeholder="Paste image URL here… (https://...)"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
        />
        <button
          onClick={handleApply}
          style={{
            padding: '10px 16px', backgroundColor: '#C17A3A', color: '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          {value ? 'Update' : 'Apply'}
        </button>
      </div>

      {error && <div style={{ fontSize: 12, color: '#E05252', marginTop: 4 }}>{error}</div>}

      {/* Tips */}
      <div style={{ marginTop: 8, padding: '10px 12px', background: '#F5F1EC', borderRadius: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B6B6B', marginBottom: 4 }}>💡 Free image sources:</div>
        <div style={{ fontSize: 12, color: '#8B8B8B', lineHeight: 1.7 }}>
          • <strong>Unsplash</strong>: unsplash.com → right-click image → Copy image address<br />
          • <strong>Imgur</strong>: imgur.com → upload → copy direct link (.jpg/.png)<br />
          • <strong>Google Drive</strong>: share file → get link → change to direct URL format<br />
          • Any public <code>https://</code> image URL works
        </div>
      </div>
    </div>
  );
}
