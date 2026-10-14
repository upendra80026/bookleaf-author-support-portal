import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Send,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  User,
  BookOpen,
  DollarSign,
  Clock,
  ShieldCheck,
  Lock,
  Edit3,
  Copy,
  Check
} from 'lucide-react';

export default function AdminTicketDetailModal({ ticketId, onClose }) {
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Overrides and status state
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const messagesEndRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  const fetchTicketDetails = () => {
    fetch(`/api/tickets/${ticketId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setTicketData(data);
        setSelectedStatus(data.status);
        setSelectedCategory(data.category);
        setSelectedPriority(data.priority);
        setSelectedAssignee(data.assigned_to || 'Unassigned');
      })
      .catch(err => console.error('Error fetching admin ticket details:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  // Real-time listener
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_ticket', ticketId);

    const handleMessageAdded = (payload) => {
      if (payload.ticket_id === ticketId) {
        setTicketData(prev => {
          if (!prev) return prev;
          const exists = prev.messages?.some(m => m.message_id === payload.message.message_id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), payload.message]
          };
        });
      }
    };

    const handleTicketUpdated = (updated) => {
      if (updated.ticket_id === ticketId) {
        setTicketData(prev => ({ ...prev, ...updated }));
        setSelectedStatus(updated.status);
        setSelectedCategory(updated.category);
        setSelectedPriority(updated.priority);
        setSelectedAssignee(updated.assigned_to || 'Unassigned');
      }
    };

    socket.on('ticket:message_added', handleMessageAdded);
    socket.on('ticket:updated', handleTicketUpdated);

    return () => {
      socket.emit('leave_ticket', ticketId);
      socket.off('ticket:message_added', handleMessageAdded);
      socket.off('ticket:updated', handleTicketUpdated);
    };
  }, [socket, ticketId]);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketData?.messages]);

  // Update ticket properties (Status, Category override, Priority override, Assignee)
  const handleUpdateTicket = async (field, value) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}`
        },
        body: JSON.stringify({ [field]: value })
      });
      const updated = await res.json();
      if (res.ok) {
        setTicketData(prev => ({ ...prev, ...updated }));
      }
    } catch (err) {
      console.error(`Error updating ticket ${field}:`, err);
    }
  };

  // Regenerate AI Draft
  const handleRegenerateDraft = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/regenerate-ai-draft`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTicketData(prev => ({
          ...prev,
          ai_draft_response: data.draft,
          ai_draft_model: data.model
        }));
      }
    } catch (err) {
      console.error('Error regenerating AI draft:', err);
    } finally {
      setRegenerating(false);
    }
  };

  // Insert AI draft into composer
  const handleUseDraft = () => {
    if (ticketData?.ai_draft_response) {
      setReplyMessage(ticketData.ai_draft_response);
      setIsInternalNote(false);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  // Send Reply or Internal Note
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}`
        },
        body: JSON.stringify({
          message: replyMessage.trim(),
          is_internal_note: isInternalNote
        })
      });

      if (res.ok) {
        setReplyMessage('');
        setIsInternalNote(false);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticketData) {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ padding: '40px', textAlign: 'center' }}>
          Loading ticket administration workspace...
        </div>
      </div>
    );
  }

  const author = ticketData.author;
  const book = ticketData.book;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '960px', width: '95%' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ background: '#f8fafc' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '800', color: 'var(--primary-800)' }}>
                {ticketData.ticket_id}
              </span>
              <span className="badge badge-category">{ticketData.category}</span>
              <span className="badge badge-priority-high">{ticketData.priority}</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: '700' }}>
              {ticketData.subject}
            </h3>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={22} />
          </button>
        </div>

        {/* Operational Management Toolbar (Status, Overrides, Assignee) */}
        <div style={{
          background: '#ffffff',
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}>
          {/* Status */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Ticket Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                handleUpdateTicket('status', e.target.value);
              }}
              className="form-select"
              style={{ marginTop: '4px', height: '34px', fontSize: '12px', fontWeight: '600' }}
            >
              <option value="Open">🔵 Open</option>
              <option value="In Progress">🟡 In Progress</option>
              <option value="Resolved">🟢 Resolved</option>
              <option value="Closed">⚪ Closed</option>
            </select>
          </div>

          {/* AI Category Override */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                AI Category
              </label>
              {ticketData.category_overridden && (
                <span style={{ fontSize: '10px', color: '#c2410c', fontWeight: '700' }}>OVERRIDDEN</span>
              )}
            </div>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                handleUpdateTicket('category', e.target.value);
              }}
              className="form-select"
              style={{ marginTop: '4px', height: '34px', fontSize: '12px' }}
            >
              <option value="Royalty & Payments">Royalty & Payments</option>
              <option value="ISBN & Metadata Issues">ISBN & Metadata Issues</option>
              <option value="Printing & Quality">Printing & Quality</option>
              <option value="Distribution & Availability">Distribution & Availability</option>
              <option value="Book Status & Production Updates">Book Status & Production Updates</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          {/* AI Priority Override */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                AI Priority Score
              </label>
              {ticketData.priority_overridden && (
                <span style={{ fontSize: '10px', color: '#c2410c', fontWeight: '700' }}>OVERRIDDEN</span>
              )}
            </div>
            <select
              value={selectedPriority}
              onChange={e => {
                setSelectedPriority(e.target.value);
                handleUpdateTicket('priority', e.target.value);
              }}
              className="form-select"
              style={{ marginTop: '4px', height: '34px', fontSize: '12px' }}
            >
              <option value="Critical">🔥 Critical (Immediate SLA)</option>
              <option value="High">⚠️ High (48h Resolution)</option>
              <option value="Medium">Medium (Standard)</option>
              <option value="Low">Low (Routine)</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Assigned To
            </label>
            <select
              value={selectedAssignee}
              onChange={e => {
                setSelectedAssignee(e.target.value);
                handleUpdateTicket('assigned_to', e.target.value);
              }}
              className="form-select"
              style={{ marginTop: '4px', height: '34px', fontSize: '12px' }}
            >
              <option value="Unassigned">Unassigned</option>
              <option value="ADMIN001">Saloni Mourya (Author Relations Lead)</option>
              <option value="ADMIN002">BookLeaf Ops Team</option>
            </select>
          </div>
        </div>

        {/* Author & Book Context Pill Banner */}
        <div style={{
          background: '#f8fafc',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} color="#0f3a2e" />
            <span>Author: <strong>{author?.name || 'N/A'}</strong> ({author?.city || 'India'}, {author?.email})</span>
          </div>
          {book && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={14} color="#0f3a2e" />
              <span>Book: <strong>{book.title}</strong> (ISBN: {book.isbn})</span>
            </div>
          )}
          {book && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
              <DollarSign size={14} color="#047857" />
              <span>Pending Royalty: <strong>₹{(book.royalty_pending || 0).toLocaleString('en-IN')}</strong></span>
            </div>
          )}
        </div>

        {/* Modal Body: AI Draft Box + Message Thread */}
        <div className="modal-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {/* AI-Drafted Response Box */}
          <div className="ai-draft-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="ai-draft-badge">
                <Sparkles size={12} />
                AI-Drafted Response Grounded in BookLeaf Knowledge Base
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleRegenerateDraft}
                  disabled={regenerating}
                  className="btn btn-secondary btn-sm"
                  title="Re-run AI draft generator"
                >
                  <RefreshCw size={12} className={regenerating ? 'spin' : ''} />
                  {regenerating ? 'Regenerating...' : 'Regenerate Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleUseDraft}
                  className="btn btn-primary btn-sm"
                  title="Insert this draft into reply editor to review and send"
                >
                  {copiedDraft ? <Check size={12} /> : <Edit3 size={12} />}
                  {copiedDraft ? 'Inserted!' : 'Insert & Edit Draft'}
                </button>
              </div>
            </div>

            <div className="ai-draft-content">
              {ticketData.ai_draft_response || 'Generating draft response...'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Model Engine: <strong>{ticketData.ai_draft_model || 'BookLeaf Heuristic Intelligence'}</strong></span>
              <span>Tone: Empathetic, Partner-level, SLA-backed</span>
            </div>
          </div>

          {/* Conversation History (Author queries, Admin replies, and Internal Notes) */}
          <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Conversation & Internal History ({ticketData.messages?.length || 0})
          </div>

          <div className="thread-container">
            {ticketData.messages?.map(msg => {
              const isAdmin = msg.sender_type === 'admin';
              const isInternal = msg.is_internal_note;

              return (
                <div
                  key={msg.message_id}
                  className={`message-bubble ${isInternal ? 'internal-note' : isAdmin ? 'admin-msg' : 'author-msg'}`}
                >
                  {isInternal && (
                    <div className="sticky-tape">INTERNAL NOTE (HIDDEN FROM AUTHOR)</div>
                  )}

                  <div className="message-sender">
                    {isInternal ? (
                      <Lock size={14} color="#b45309" />
                    ) : isAdmin ? (
                      <ShieldCheck size={14} color="#047857" />
                    ) : (
                      <User size={14} color="#0f3a2e" />
                    )}
                    <span>{msg.sender_name}</span>
                    <span style={{ fontSize: '10px', color: isInternal ? '#b45309' : isAdmin ? '#047857' : 'var(--text-muted)', fontWeight: 'normal' }}>
                      {isInternal ? '• Internal Operations Note' : isAdmin ? '• BookLeaf Operations Team' : '• Author'}
                    </span>
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="message-text">{msg.message}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Composer Footer */}
        <form onSubmit={handleSendMessage} className="modal-footer" style={{ flexDirection: 'column', gap: '10px' }}>
          {/* Toggle between Public Reply and Internal Note */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsInternalNote(false)}
                className={`btn btn-sm ${!isInternalNote ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Send size={12} /> Send Response to Author
              </button>
              <button
                type="button"
                onClick={() => setIsInternalNote(true)}
                className={`btn btn-sm ${isInternalNote ? 'btn-accent' : 'btn-secondary'}`}
              >
                <Lock size={12} /> Add Internal Note (Team Only)
              </button>
            </div>

            <span style={{ fontSize: '12px', color: isInternalNote ? '#b45309' : 'var(--text-muted)', fontWeight: isInternalNote ? '700' : 'normal' }}>
              {isInternalNote ? '🔒 Only visible to BookLeaf team members' : '✉️ Will be delivered directly to the author'}
            </span>
          </div>

          <div style={{ width: '100%' }}>
            <textarea
              className="form-textarea"
              rows={3}
              style={{
                borderColor: isInternalNote ? '#f59e0b' : 'var(--border-color)',
                background: isInternalNote ? '#fffbeb' : '#ffffff'
              }}
              placeholder={isInternalNote ? "Write an internal operational note (e.g. escalated to Repro India, batch ID #8892)..." : "Draft your response to the author. You can click 'Insert & Edit Draft' above to use the AI suggestion..."}
              value={replyMessage}
              onChange={e => setReplyMessage(e.target.value)}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Close
            </button>
            <button
              type="submit"
              disabled={sending || !replyMessage.trim()}
              className={`btn btn-sm ${isInternalNote ? 'btn-accent' : 'btn-primary'}`}
            >
              {isInternalNote ? <Lock size={13} /> : <Send size={13} />}
              {sending ? 'Saving...' : isInternalNote ? 'Save Internal Note' : 'Send Response to Author'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
