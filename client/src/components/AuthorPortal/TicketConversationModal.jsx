import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, Send, Clock, BookOpen, CheckCircle2, User, ShieldCheck, Paperclip } from 'lucide-react';

export default function TicketConversationModal({ ticketId, onClose }) {
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket } = useSocket();

  const fetchTicketDetails = () => {
    fetch(`/api/tickets/${ticketId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setTicketData(data);
      })
      .catch(err => console.error('Error fetching ticket details:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  // Real-time listener for this ticket
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_ticket', ticketId);

    const handleMessageAdded = (payload) => {
      if (payload.ticket_id === ticketId) {
        setTicketData(prev => {
          if (!prev) return prev;
          // Avoid duplicate messages
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

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketData?.messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}`
        },
        body: JSON.stringify({
          message: replyText.trim(),
          is_internal_note: false
        })
      });

      const newMsg = await res.json();
      if (res.ok) {
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticketData) {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ padding: '40px', textAlign: 'center' }}>
          Loading conversation thread...
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary-800)' }}>
                {ticketData.ticket_id}
              </span>
              <span className="badge badge-status-open">{ticketData.status}</span>
              <span className="badge badge-category">{ticketData.category}</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700' }}>
              {ticketData.subject}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Book Context Banner */}
        {ticketData.book && (
          <div style={{ background: '#f8fafc', padding: '10px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
            <BookOpen size={16} color="#0f3a2e" />
            <span>Book: <strong>{ticketData.book.title}</strong> (ISBN: {ticketData.book.isbn})</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>Status: <strong>{ticketData.book.status}</strong></span>
          </div>
        )}

        {/* Conversation Thread */}
        <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
          <div className="thread-container">
            {ticketData.messages?.map(msg => {
              const isAdmin = msg.sender_type === 'admin';
              return (
                <div
                  key={msg.message_id}
                  className={`message-bubble ${isAdmin ? 'admin-msg' : 'author-msg'}`}
                >
                  <div className="message-sender">
                    {isAdmin ? <ShieldCheck size={14} color="#047857" /> : <User size={14} color="#0f3a2e" />}
                    <span>{msg.sender_name}</span>
                    <span style={{ fontSize: '10px', color: isAdmin ? '#047857' : 'var(--text-muted)', fontWeight: 'normal' }}>
                      ({isAdmin ? 'BookLeaf Team' : 'Author'})
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

        {/* Author Reply Composer */}
        <form onSubmit={handleSendReply} className="modal-footer" style={{ flexDirection: 'column', gap: '10px' }}>
          <div style={{ width: '100%' }}>
            <textarea
              className="form-textarea"
              rows={2}
              style={{ minHeight: '70px' }}
              placeholder="Type your response to the BookLeaf team..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              disabled={ticketData.status === 'Closed'}
            ></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {ticketData.status === 'Closed' ? 'This ticket is closed. Submit a new query if needed.' : 'Responses update in real-time.'}
            </span>
            <button
              type="submit"
              disabled={sending || !replyText.trim() || ticketData.status === 'Closed'}
              className="btn btn-primary btn-sm"
            >
              <Send size={13} /> {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
