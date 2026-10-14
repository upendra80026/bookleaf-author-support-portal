import React from 'react';
import { BookOpen, DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';

export default function MyBooks({ books = [], onRaiseTicketForBook }) {
  // Aggregate stats
  const totalEarned = books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0);
  const totalPending = books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0);
  const totalSold = books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0);
  const liveBooksCount = books.filter(b => b.status === 'Published & Live').length;

  return (
    <div>
      {/* Metric Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">My Published Titles</span>
            <div className="kpi-icon-wrap"><BookOpen size={18} /></div>
          </div>
          <div className="kpi-value">{books.length}</div>
          <div className="kpi-subtext">{liveBooksCount} live in distribution catalog</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Copies Sold</span>
            <div className="kpi-icon-wrap"><TrendingUp size={18} /></div>
          </div>
          <div className="kpi-value">{totalSold.toLocaleString('en-IN')}</div>
          <div className="kpi-subtext">Across Amazon, Flipkart & Store</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Royalties Earned</span>
            <div className="kpi-icon-wrap" style={{ color: '#047857', background: '#ecfdf5' }}><DollarSign size={18} /></div>
          </div>
          <div className="kpi-value royalty-highlight">₹{totalEarned.toLocaleString('en-IN')}</div>
          <div className="kpi-subtext">80% author profit split accrued</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Royalty Pending Payout</span>
            <div className="kpi-icon-wrap" style={{ color: '#c2410c', background: '#ffedd5' }}><Clock size={18} /></div>
          </div>
          <div className="kpi-value royalty-pending-highlight">₹{totalPending.toLocaleString('en-IN')}</div>
          <div className="kpi-subtext">
            {totalPending >= 1000 ? 'Eligible for next quarterly cycle' : 'Below ₹1,000 threshold (rolls over)'}
          </div>
        </div>
      </div>

      {/* Books Catalog Grid */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <BookOpen size={20} color="#0f3a2e" />
            My Published & Production Titles ({books.length})
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing verified catalog data from BookLeaf master records
          </span>
        </div>

        {books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <p>No books registered under this account yet.</p>
          </div>
        ) : (
          <div className="books-grid">
            {books.map(book => {
              const isInProduction = book.status?.toLowerCase().includes('production');
              return (
                <div key={book.book_id} className="book-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span className={`badge ${isInProduction ? 'badge-status-inprogress' : 'badge-status-resolved'}`}>
                        {isInProduction ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                        {book.status}
                      </span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-light)' }}>
                        {book.book_id}
                      </span>
                    </div>

                    <div className="book-card-header mt-12">
                      <h3 className="book-title">{book.title}</h3>
                      <div className="book-genre">{book.genre}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                        ISBN: <strong>{book.isbn}</strong>
                      </div>
                    </div>

                    {/* Metadata specs */}
                    <div className="book-meta-grid">
                      <div>
                        <div className="meta-item-label">MRP</div>
                        <div className="meta-item-val">{book.mrp ? `₹${book.mrp}` : 'Pending Price'}</div>
                      </div>
                      <div>
                        <div className="meta-item-label">Publication Date</div>
                        <div className="meta-item-val">{book.publication_date || 'In Pipeline'}</div>
                      </div>
                      <div>
                        <div className="meta-item-label">Total Sold</div>
                        <div className="meta-item-val">{book.total_copies_sold ? `${book.total_copies_sold} copies` : '0 copies'}</div>
                      </div>
                      <div>
                        <div className="meta-item-label">Royalty / Copy</div>
                        <div className="meta-item-val">{book.author_royalty_per_copy ? `₹${book.author_royalty_per_copy}` : '—'}</div>
                      </div>
                      <div>
                        <div className="meta-item-label">Total Earned</div>
                        <div className="meta-item-val royalty-highlight">₹{(book.total_royalty_earned || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div className="meta-item-label">Royalty Pending</div>
                        <div className="meta-item-val royalty-pending-highlight">₹{(book.royalty_pending || 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Distribution Platforms */}
                    <div style={{ margin: '10px 0' }}>
                      <div className="meta-item-label">Available Retailers:</div>
                      {book.available_on && book.available_on.length > 0 ? (
                        book.available_on.map((channel, i) => (
                          <span key={i} className="channel-tag">{channel}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Distribution setup will commence after printing.
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Printer: <strong>{book.print_partner || 'TBD'}</strong>
                    </span>
                    <button
                      onClick={() => onRaiseTicketForBook(book.book_id)}
                      className="btn btn-secondary btn-sm"
                      title="Raise support query linked to this book"
                    >
                      <PlusCircle size={12} /> Raise Query
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
