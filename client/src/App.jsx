import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import MyBooks from './components/AuthorPortal/MyBooks';
import MyTickets from './components/AuthorPortal/MyTickets';
import SubmitQueryModal from './components/AuthorPortal/SubmitQueryModal';
import TicketConversationModal from './components/AuthorPortal/TicketConversationModal';
import AdminDashboard from './components/AdminPortal/AdminDashboard';
import AllCatalog from './components/AdminPortal/AllCatalog';
import AdminTicketDetailModal from './components/AdminPortal/AdminTicketDetailModal';

export default function App() {
  const { user, isAuthor, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('books');
  const [authorBooks, setAuthorBooks] = useState([]);

  // Modals state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [defaultBookIdForQuery, setDefaultBookIdForQuery] = useState('');
  const [selectedTicketIdForAuthor, setSelectedTicketIdForAuthor] = useState(null);
  const [selectedTicketIdForAdmin, setSelectedTicketIdForAdmin] = useState(null);

  // Sync default tab when role changes
  useEffect(() => {
    if (isAdmin) {
      setActiveTab('queue');
    } else {
      setActiveTab('books');
    }
  }, [isAdmin, user?.author_id]);

  // Fetch author books when author is active
  useEffect(() => {
    if (isAuthor && user) {
      fetch('/api/books', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('bookleaf_token')}` }
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setAuthorBooks(data);
        })
        .catch(err => console.error('Error fetching author books:', err));
    }
  }, [isAuthor, user?.author_id]);

  const handleRaiseTicketForBook = (bookId) => {
    setDefaultBookIdForQuery(bookId);
    setShowSubmitModal(true);
  };

  const handleTicketCreated = (newTicket) => {
    // Switch to tickets tab so author immediately sees their new ticket
    setActiveTab('tickets');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'var(--font-body)',
        color: '#0f3a2e'
      }}>
        <h2>Loading BookLeaf Support Portal...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {/* AUTHOR PORTAL */}
        {isAuthor && (
          <div>
            {activeTab === 'books' && (
              <MyBooks
                books={authorBooks}
                onRaiseTicketForBook={handleRaiseTicketForBook}
              />
            )}

            {activeTab === 'tickets' && (
              <MyTickets
                onSelectTicket={id => setSelectedTicketIdForAuthor(id)}
                onOpenNewQuery={() => {
                  setDefaultBookIdForQuery('');
                  setShowSubmitModal(true);
                }}
              />
            )}
          </div>
        )}

        {/* ADMIN PORTAL */}
        {isAdmin && (
          <div>
            {activeTab === 'queue' && (
              <AdminDashboard
                onSelectTicket={id => setSelectedTicketIdForAdmin(id)}
              />
            )}

            {activeTab === 'all-books' && (
              <AllCatalog />
            )}
          </div>
        )}
      </main>

      {/* Author Submit Query Modal */}
      {showSubmitModal && (
        <SubmitQueryModal
          books={authorBooks}
          defaultBookId={defaultBookIdForQuery}
          onClose={() => setShowSubmitModal(false)}
          onTicketCreated={handleTicketCreated}
        />
      )}

      {/* Author Conversation Modal */}
      {selectedTicketIdForAuthor && (
        <TicketConversationModal
          ticketId={selectedTicketIdForAuthor}
          onClose={() => setSelectedTicketIdForAuthor(null)}
        />
      )}

      {/* Admin Ticket Workspace Modal */}
      {selectedTicketIdForAdmin && (
        <AdminTicketDetailModal
          ticketId={selectedTicketIdForAdmin}
          onClose={() => setSelectedTicketIdForAdmin(null)}
        />
      )}

      {/* Footer */}
      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid var(--border-color)',
        padding: '20px 24px',
        marginTop: 'auto',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <strong>BookLeaf Publishing</strong> • Author Support & Communication Portal (Technical Assignment 1 of 2)
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Architecture: REST + WebSocket + Multi-Provider AI</span>
            <span>Dataset: 10 Authors, 18 Books</span>
            <span>Evaluation Mode: Auto-Seeded</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
