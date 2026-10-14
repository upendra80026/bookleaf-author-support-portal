import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  Inbox,
  Filter,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  User,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';

export default function AdminDashboard({ onSelectTicket }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortByOldest, setSortByOldest] = useState(false);
  const { socket } = useSocket();

  const fetchTickets = () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'All') params.append('status', statusFilter);
    if (categoryFilter !== 'All') params.append('category', categoryFilter);
    if (priorityFilter !== 'All') params.append('priority', priorityFilter);
    if (search.trim()) params.append('search', search.trim());
    if (sortByOldest) params.append('sortBy', 'oldest_unresolved');

    fetch(`/api/tickets?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTickets(data);
      })
      .catch(err => console.error('Error fetching admin tickets:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, priorityFilter, search, sortByOldest]);

  // Real-Time Socket Updates for Admin Queue
  useEffect(() => {
    if (!socket) return;

    const handleTicketCreated = (newTicket) => {
      setTickets(prev => [newTicket, ...prev]);
    };

    const handleTicketUpdated = (updated) => {
      setTickets(prev => prev.map(t => t.ticket_id === updated.ticket_id ? { ...t, ...updated } : t));
    };

    const handleMessageAdded = () => {
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

  // Metrics calculation
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' || t.priority === 'High').length;
  const oldestTicket = tickets.find(t => t.status === 'Open' || t.status === 'In Progress');

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return <span className="badge badge-priority-critical pulse-critical">🔥 Critical</span>;
      case 'High':
        return <span className="badge badge-priority-high">⚠️ High</span>;
      case 'Medium':
        return <span className="badge badge-priority-medium">Medium</span>;
      case 'Low':
        return <span className="badge badge-priority-low">Low</span>;
      default:
        return <span className="badge">{priority}</span>;
    }
  };

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
    <div>
      {/* Executive KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Support Queue</span>
            <div className="kpi-icon-wrap"><Inbox size={18} /></div>
          </div>
          <div className="kpi-value">{totalCount}</div>
          <div className="kpi-subtext">{openCount} unassigned or awaiting action</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Critical & High Priority</span>
            <div className="kpi-icon-wrap" style={{ color: '#be123c', background: '#ffe4e6' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#be123c' }}>{criticalCount}</div>
          <div className="kpi-subtext">Requires immediate resolution within 48h SLA</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">AI Auto-Classification</span>
            <div className="kpi-icon-wrap" style={{ color: '#165444', background: '#e2f5ee' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-value">100%</div>
          <div className="kpi-subtext">6 categories + grounded response drafting</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Oldest Pending Ticket</span>
            <div className="kpi-icon-wrap" style={{ color: '#b45309', background: '#fef3c7' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '20px', paddingTop: '6px' }}>
            {oldestTicket ? oldestTicket.ticket_id : 'Queue Clear'}
          </div>
          <div className="kpi-subtext">
            {oldestTicket ? `${oldestTicket.author_name} (${oldestTicket.category})` : 'All caught up!'}
          </div>
        </div>
      </div>

      {/* Main Ticket Queue Panel */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <Inbox size={20} color="#0f3a2e" />
              Incoming Support Ticket Queue
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Filter by status, category, priority, and spot urgent author escalations
            </span>
          </div>

          <button
            onClick={() => setSortByOldest(!sortByOldest)}
            className={`btn btn-sm ${sortByOldest ? 'btn-accent' : 'btn-secondary'}`}
            title="Sort oldest unresolved tickets first"
          >
            <ArrowUpDown size={13} />
            {sortByOldest ? 'Sorting: Oldest Unresolved First' : 'Sort: Oldest Unresolved'}
          </button>
        </div>

        {/* Filter Toolbar */}
        <div style={{
          background: 'var(--surface-subtle)',
          padding: '14px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search author, book, or subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', height: '36px', fontSize: '13px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', height: '36px', fontSize: '13px' }}
          >
            <option value="All">All Categories</option>
            <option value="Royalty & Payments">Royalty & Payments</option>
            <option value="ISBN & Metadata Issues">ISBN & Metadata Issues</option>
            <option value="Printing & Quality">Printing & Quality</option>
            <option value="Distribution & Availability">Distribution & Availability</option>
            <option value="Book Status & Production Updates">Book Status & Production Updates</option>
            <option value="General Inquiry">General Inquiry</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', height: '36px', fontSize: '13px' }}
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
            Loading queue...
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="#047857" style={{ margin: '0 auto 12px auto' }} />
            <h4>No tickets match the current filters</h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Try resetting the filters or search query.</p>
          </div>
        ) : (
          <div>
            {tickets.map(ticket => {
              const isUrgent = ticket.priority === 'Critical' || (ticket.priority === 'High' && ticket.status === 'Open');
              return (
                <div
                  key={ticket.ticket_id}
                  onClick={() => onSelectTicket(ticket.ticket_id)}
                  className={`ticket-row-item ${isUrgent ? 'urgent-border' : ''}`}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '800', color: 'var(--primary-800)' }}>
                        {ticket.ticket_id}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      <span className="badge badge-category">
                        {ticket.category}
                        {ticket.category_overridden && <span style={{ opacity: 0.7, fontStyle: 'italic' }}> (overridden)</span>}
                      </span>
                      {ticket.assigned_to && ticket.assigned_to !== 'Unassigned' && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                          Assigned: {ticket.assigned_to}
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                      {ticket.subject}
                    </h4>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span>Author: <strong>{ticket.author_name}</strong></span>
                      <span>Book: <strong>{ticket.book_title}</strong></span>
                      <span>Created: {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none' }}>
                      Manage Ticket →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
