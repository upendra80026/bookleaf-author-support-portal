import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { MessageSquare, Clock, Plus, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';

export default function MyTickets({ onSelectTicket, onOpenNewQuery }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const { socket } = useSocket();

  const fetchTickets = () => {
    fetch('/api/tickets', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTickets(data);
      })
      .catch(err => console.error('Error fetching tickets:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Real-Time Socket Listener: Update ticket list instantly without refresh!
  useEffect(() => {
    if (!socket) return;

    const handleTicketCreated = (newTicket) => {
      setTickets(prev => [newTicket, ...prev]);
    };

    const handleTicketUpdated = (updatedTicket) => {
      setTickets(prev => prev.map(t => t.ticket_id === updatedTicket.ticket_id ? { ...t, ...updatedTicket } : t));
    };

    const handleMessageAdded = (data) => {
      // Refresh tickets to update timestamps/status
      fetchTickets();
    };

    socket.on('ticket:created', handleTicketCreated);
    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('ticket:message_added', handleMessageAdded);

    return () => {
      socket.off('ticket:created', handleTicketCreated);
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('ticket:message_added', handleMessageAdded);
    };
  }, [socket]);

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <span className="badge badge-status-open"><Clock size={11} /> Open</span>;
      case 'In Progress':
        return <span className="badge badge-status-inprogress"><Clock size={11} /> In Progress</span>;
      case 'Resolved':
        return <span className="badge badge-status-resolved"><CheckCircle2 size={11} /> Resolved</span>;
      case 'Closed':
        return <span className="badge badge-status-closed">Closed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            <MessageSquare size={20} color="#0f3a2e" />
            My Support Queries & Tickets
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time synchronization active — responses appear live without refreshing
          </span>
        </div>
        <button onClick={onOpenNewQuery} className="btn btn-primary btn-sm">
          <Plus size={14} /> Submit New Query
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px' }}
          >
            {st} {st === 'All' ? `(${tickets.length})` : `(${tickets.filter(t => t.status === st).length})`}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
          Loading your support tickets...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <FileText size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h4>No tickets found in this view</h4>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            Have a question about royalties, production, or printing? Submit a ticket above.
          </p>
        </div>
      ) : (
        <div>
          {filteredTickets.map(ticket => (
            <div
              key={ticket.ticket_id}
              onClick={() => onSelectTicket(ticket.ticket_id)}
              className="ticket-row-item"
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '700', color: 'var(--primary-800)' }}>
                    {ticket.ticket_id}
                  </span>
                  {getStatusBadge(ticket.status)}
                  <span className="badge badge-category">{ticket.category}</span>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {ticket.subject}
                </h4>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span>Book: <strong>{ticket.book_title}</strong></span>
                  <span>Raised: {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none' }}>
                  View Thread <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
