import React, { useState, useRef } from 'react';
import { FileText, Upload, X } from 'lucide-react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * PdfUpload — upload a PDF to Cloudinary (unsigned preset) or paste a URL.
 * The file picker only appears when Cloudinary env vars are configured.
 */
export default function PdfUpload({ value, onChange, label = 'PDF Material' }) {
  const [input, setInput] = useState(value || '');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const uploadEnabled = !!(CLOUD_NAME && UPLOAD_PRESET);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('PDF too large (max 10MB).'); return; }

    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, { method: 'POST', body });
      const json = await res.json();
      if (!json.secure_url) throw new Error(json?.error?.message || 'Upload failed.');
      setInput(json.secure_url);
      onChange(json.secure_url);
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

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1A1A1A' }}>{label}</label>

      {value && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
          padding: '10px 12px', background: '#F7F7F7', borderRadius: 10, border: '1px solid #E2E2E2',
        }}>
          <FileText size={16} color="#555" style={{ flexShrink: 0 }} />
          <a href={value} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 13, color: '#2563EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value}
          </a>
          <button
            onClick={() => { setInput(''); onChange(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
            title="Remove PDF"
          ><X size={14} color="#999" /></button>
        </div>
      )}

      {uploadEnabled && (
        <>
          <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              width: '100%', padding: '16px', marginBottom: 8,
              backgroundColor: '#FAFAFA', color: uploading ? '#AAA' : '#555',
              border: '1.5px dashed #C9C9C9', borderRadius: 10,
              cursor: uploading ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Upload size={15} />
            {uploading ? 'Uploading…' : 'Click to upload PDF'}
          </button>
        </>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{
            flex: 1, padding: '10px 14px',
            border: `1.5px solid ${error ? '#E05252' : '#E2E2E2'}`,
            borderRadius: 10, fontSize: 14, outline: 'none',
            color: '#1A1A1A', backgroundColor: '#FAFAFA',
          }}
          placeholder={uploadEnabled ? '…or paste a PDF URL (https://...)' : 'Paste a PDF URL (https://...)'}
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
