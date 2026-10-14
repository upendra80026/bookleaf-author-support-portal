import React, { useState, useEffect } from 'react';
import { BookOpen, DollarSign, TrendingUp, Search } from 'lucide-react';

export default function AllCatalog() {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/books', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}` }
      }).then(r => r.json()),
      fetch('/api/auth/demo-users').then(r => r.json())
    ])
      .then(([booksData, usersData]) => {
        if (Array.isArray(booksData)) setBooks(booksData);
        if (usersData?.authors) setAuthors(usersData.authors);
      })
      .catch(err => console.error('Error fetching catalog:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalCopies = books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0);
  const totalEarned = books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0);
  const totalPending = books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0);

  const getAuthorName = (authorId) => {
    const a = authors.find(item => item.author_id === authorId);
    return a ? a.name : authorId;
  };

  const filtered = books.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q) ||
      getAuthorName(b.author_id).toLowerCase().includes(q) ||
      b.genre.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Catalog Titles</span>
            <div className="kpi-icon-wrap"><BookOpen size={18} /></div>
          </div>
          <div className="kpi-value">{books.length}</div>
          <div className="kpi-subtext">Across 10 registered authors</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Catalog Copies Sold</span>
            <div className="kpi-icon-wrap"><TrendingUp size={18} /></div>
          </div>
          <div className="kpi-value">{totalCopies.toLocaleString('en-IN')}</div>
          <div className="kpi-subtext">Multi-platform distribution volume</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Royalties Disbursed</span>
            <div className="kpi-icon-wrap" style={{ color: '#047857', background: '#ecfdf5' }}><DollarSign size={18} /></div>
          </div>
          <div className="kpi-value royalty-highlight">₹{totalEarned.toLocaleString('en-IN')}</div>
          <div className="kpi-subtext">Cumulative author earnings</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pending Payout Liability</span>
            <div className="kpi-icon-wrap" style={{ color: '#b45309', background: '#fef3c7' }}><DollarSign size={18} /></div>
          </div>
          <div className="kpi-value royalty-pending-highlight">₹{totalPending.toLocaleString('en-IN')}</div>
          <div className="kpi-subtext">Scheduled for next 45-day window</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <BookOpen size={20} color="#0f3a2e" />
              Master Catalog & Royalty Registry
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Complete catalog overview across all authors, printers, and platforms
            </span>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search title, author, ISBN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title & Genre</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Status</th>
                <th>Copies Sold</th>
                <th>Earned</th>
                <th>Pending</th>
                <th>Printer</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.book_id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{b.book_id}</td>
                  <td>
                    <strong>{b.title}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.genre}</div>
                  </td>
                  <td>{getAuthorName(b.author_id)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{b.isbn}</td>
                  <td>
                    <span className={`badge ${b.status?.includes('Production') ? 'badge-status-inprogress' : 'badge-status-resolved'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>{b.total_copies_sold ? `${b.total_copies_sold} copies` : '0'}</td>
                  <td className="royalty-highlight">₹{(b.total_royalty_earned || 0).toLocaleString('en-IN')}</td>
                  <td className="royalty-pending-highlight">₹{(b.royalty_pending || 0).toLocaleString('en-IN')}</td>
                  <td>{b.print_partner || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
