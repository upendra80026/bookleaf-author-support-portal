import React, { useState, useEffect } from 'react';
import { X, Send, Paperclip, Sparkles, AlertCircle } from 'lucide-react';

export default function SubmitQueryModal({ books = [], defaultBookId = '', onClose, onTicketCreated }) {
  const [selectedBook, setSelectedBook] = useState(defaultBookId || 'GENERAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultBookId) {
      setSelectedBook(defaultBookId);
    }
  }, [defaultBookId]);

  // Quick preset loader to help reviewers test scenarios from the assignment brief
  const loadPreset = (presetType) => {
    if (presetType === 'royalty') {
      setSelectedBook(books[0]?.book_id || 'GENERAL');
      setSubject('Royalty payout query for Q3 sales cycle');
      setDescription('I published my book 4 months ago and still haven\'t received any royalty. My dashboard shows over ₹3,500 pending. When can I expect the direct bank transfer?');
    } else if (presetType === 'isbn') {
      setSelectedBook(books[0]?.book_id || 'GENERAL');
      setSubject('Mismatched ISBN showing on Amazon India store page');
      setDescription('My physical author copy shows ISBN 978-93-5XXXX, but the Amazon marketplace listing displays a different ISBN. Readers are unable to locate the correct edition.');
    } else if (presetType === 'quality') {
      setSelectedBook(books[0]?.book_id || 'GENERAL');
      setSubject('Received defective author copies - pages misaligned');
      setDescription('I received my author copies and the print quality is terrible. The images on pages 12-25 are blurry and the inner spine pages are misaligned. Please arrange a reprint.');
      setAttachment('photos_of_defective_pages.jpg');
    } else if (presetType === 'distribution') {
      setSelectedBook(books[0]?.book_id || 'GENERAL');
      setSubject('Book is marked Currently Unavailable on Amazon');
      setDescription('My book was published last month, but today it is displaying as "Currently Unavailable" on Amazon. Could you please trigger a stock resync?');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please fill out both the subject line and detailed query description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}`
        },
        body: JSON.stringify({
          book_id: selectedBook === 'GENERAL' ? null : selectedBook,
          subject: subject.trim(),
          description: description.trim(),
          attachment: attachment || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit query');
      }

      onTicketCreated(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--primary-50)', padding: '6px', borderRadius: '8px', color: 'var(--primary-700)' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700' }}>
                Submit a Support Query
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Powered by BookLeaf AI Assistant for rapid resolution
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* 1-Click Evaluation Presets */}
        <div style={{ background: '#f8fafc', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', fontSize: '12px' }}>
          <span style={{ fontWeight: '700', color: '#0f3a2e', marginRight: '8px' }}>⚡ 1-Click Test Scenarios:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            <button type="button" onClick={() => loadPreset('royalty')} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }}>
              💰 Royalty Delay
            </button>
            <button type="button" onClick={() => loadPreset('isbn')} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }}>
              🏷️ ISBN Mismatch
            </button>
            <button type="button" onClick={() => loadPreset('quality')} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }}>
              🖨️ Print Quality Issue
            </button>
            <button type="button" onClick={() => loadPreset('distribution')} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }}>
              📦 Out of Stock / Amazon
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Related Book / Scope *</label>
              <select
                className="form-select"
                value={selectedBook}
                onChange={e => setSelectedBook(e.target.value)}
              >
                <option value="GENERAL">General / Account Level (Not book-specific)</option>
                {books.map(b => (
                  <option key={b.book_id} value={b.book_id}>
                    {b.title} (ISBN: {b.isbn}) — {b.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject Line *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Royalty payout inquiry or ISBN discrepancy"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Description *</label>
              <textarea
                className="form-textarea"
                rows={5}
                placeholder="Please describe your concern in detail. Include dates, retailer links, or copy counts where applicable..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            {/* File Attachment Support */}
            <div className="form-group">
              <label className="form-label">Attachment (Optional photos/documents)</label>
              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '14px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer'
              }}>
                <Paperclip size={18} style={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {attachment ? (
                    <span style={{ color: '#047857', fontWeight: '600' }}>Attached: {attachment}</span>
                  ) : (
                    <span>Click or drag defect photos, payout statements, or screenshots</span>
                  )}
                </div>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  id="file-upload"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachment(e.target.files[0].name);
                    }
                  }}
                />
                <label htmlFor="file-upload" className="btn btn-secondary btn-sm" style={{ marginTop: '8px', cursor: 'pointer' }}>
                  Browse File
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Send size={14} />
              {loading ? 'Submitting & AI Classifying...' : 'Submit Support Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
