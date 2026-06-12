import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';

const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY;

/**
 * ImageUpload — pick a file (uploaded to ImgBB) or paste a public URL.
 */
export default function ImageUpload({ value, onChange, label = 'Image', aspect, emptyPreview }) {
  const [input, setInput] = useState(value || '');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    if (!IMGBB_KEY) { setError('Upload not configured (missing ImgBB key).'); return; }
    if (file.size > 16 * 1024 * 1024) { setError('Image too large (max 16MB).'); return; }

    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body });
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message || 'Upload failed.');
      const url = json.data.display_url;
      setInput(url);
      onChange(url);
    } catch (err) {
      setError(err.message || 'Upload failed. Try again or paste a URL.');
    } finally {
      setUploading(false);
    }
  }

  function handleApply() {
    const url = input.trim();
    if (!url) { onChange(''); return; }
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

      {/* Empty fallback preview (mirrors how the app renders it when unset) */}
      {!value && emptyPreview && (
        <div style={{
          width: '100%', height: 110, borderRadius: 10, marginBottom: 10,
          backgroundColor: '#0D0D0D',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.45)', fontSize: 12,
        }}>
          No image — solid black background will be shown
        </div>
      )}

      {/* Preview */}
      {value && (
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <img
            src={value}
            alt="preview"
            onError={e => { e.target.style.display = 'none'; }}
            style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, border: '1.5px solid #E2E2E2', display: 'block' }}
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
          ><X size={14} /></button>
        </div>
      )}

      {/* Upload button */}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          width: '100%', padding: '18px 16px', marginBottom: 8,
          backgroundColor: '#FAFAFA', color: uploading ? '#AAA' : '#555',
          border: '1.5px dashed #C9C9C9', borderRadius: 10,
          cursor: uploading ? 'default' : 'pointer',
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => { if (!uploading) { e.currentTarget.style.backgroundColor = '#F0F0F0'; e.currentTarget.style.borderColor = '#999'; } }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FAFAFA'; e.currentTarget.style.borderColor = '#C9C9C9'; }}
      >
        <Upload size={15} />
        {uploading ? 'Uploading…' : 'Click to upload image'}
      </button>

      {/* URL input fallback */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{
            flex: 1, padding: '10px 14px',
            border: `1.5px solid ${error ? '#E05252' : '#E2E2E2'}`,
            borderRadius: 10, fontSize: 14, outline: 'none',
            color: '#1A1A1A', backgroundColor: '#FAFAFA',
          }}
          placeholder="…or paste an image URL (https://...)"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
        />
        <button
          onClick={handleApply}
          style={{
            padding: '10px 16px', backgroundColor: '#555', color: '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          {value ? 'Update' : 'Apply'}
        </button>
      </div>

      {error && <div style={{ fontSize: 12, color: '#E05252', marginTop: 4 }}>{error}</div>}
    </div>
  );
}
