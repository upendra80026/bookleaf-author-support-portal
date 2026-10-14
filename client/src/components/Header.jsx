import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { BookOpen, ShieldCheck, User, ExternalLink, Radio } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const { user, isAdmin, isAuthor, demoUsers, switchUser, logout } = useAuth();
  const { isConnected } = useSocket();

  const handleAuthorChange = (e) => {
    const authorId = e.target.value;
    const author = demoUsers.authors.find(a => a.author_id === authorId);
    if (author) {
      switchUser(author, 'author');
    }
  };

  const handleAdminSwitch = () => {
    if (demoUsers.admins && demoUsers.admins.length > 0) {
      switchUser(demoUsers.admins[0], 'admin');
    }
  };

  return (
    <header className="top-header">
      {/* Evaluator Quick Switch Toolbar */}
      <div className="evaluator-toolbar">
        <div className="evaluator-toolbar-left">
          <span className="evaluator-badge">EVALUATION SWITCHER</span>
          <span>Switch Perspectives in 1 Click:</span>
          
          <button
            onClick={() => {
              if (isAdmin && demoUsers.authors?.length > 0) {
                switchUser(demoUsers.authors[0], 'author');
              }
            }}
            className={`btn-pill-role ${isAuthor ? 'active' : ''}`}
          >
            <User size={13} /> Author View
          </button>

          <button
            onClick={handleAdminSwitch}
            className={`btn-pill-role ${isAdmin ? 'active' : ''}`}
          >
            <ShieldCheck size={13} /> Admin Portal
          </button>

          {isAuthor && demoUsers.authors?.length > 0 && (
            <select
              value={user?.author_id || ''}
              onChange={handleAuthorChange}
              className="author-select-dropdown"
              title="Switch to another sample author"
            >
              {demoUsers.authors.map(a => (
                <option key={a.author_id} value={a.author_id}>
                  {a.name} ({a.city})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="evaluator-toolbar-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#cbd5e1' }}>
            <span className={`pulse-dot ${isConnected ? '' : 'pulse-critical'}`} style={{ background: isConnected ? '#10b981' : '#e11d48' }}></span>
            <span>{isConnected ? 'Real-Time Live' : 'Reconnecting...'}</span>
          </div>

          <a
            href="http://localhost:5000/api/docs"
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#fbbf24',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              background: 'rgba(251, 191, 36, 0.1)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}
          >
            <ExternalLink size={11} /> Swagger API Docs
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="header-inner">
        <div className="brand-wrapper">
          <div className="brand-logo-badge">
            <BookOpen size={22} />
          </div>
          <div className="brand-info">
            <h1>BookLeaf Publishing</h1>
            <p>Author Support & Communication Platform</p>
          </div>
        </div>

        {/* Tab Navigation depending on Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthor && (
            <div className="nav-tabs">
              <button
                className={`nav-tab-btn ${activeTab === 'books' ? 'active' : ''}`}
                onClick={() => setActiveTab('books')}
              >
                📚 My Books
              </button>
              <button
                className={`nav-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
                onClick={() => setActiveTab('tickets')}
              >
                💬 My Tickets
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="nav-tabs">
              <button
                className={`nav-tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
                onClick={() => setActiveTab('queue')}
              >
                🎯 Support Ticket Queue
              </button>
              <button
                className={`nav-tab-btn ${activeTab === 'all-books' ? 'active' : ''}`}
                onClick={() => setActiveTab('all-books')}
              >
                📖 Catalog & Royalties
              </button>
            </div>
          )}

          {/* User Profile Capsule */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--surface-subtle)',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid var(--border-color)',
            fontSize: '13px'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: isAdmin ? '#d97706' : '#0f3a2e',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '12px'
            }}>
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <div style={{ fontWeight: '700', lineHeight: 1.1 }}>{user?.name || 'Guest User'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {isAdmin ? 'BookLeaf Operations Lead' : `Author (${user?.city || 'India'})`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
