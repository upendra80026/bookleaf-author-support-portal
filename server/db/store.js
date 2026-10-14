/**
 * Persistent Data Store for BookLeaf Author Support Portal
 * Features atomic read/write, relational lookups, and auto-seeding
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'database.json');
const SAMPLE_DATA_FILE = path.join(__dirname, '../../data/bookleaf_sample_data.json');

class Store {
  constructor() {
    this.data = {
      authors: [],
      books: [],
      admins: [],
      tickets: [],
      ticket_messages: []
    };
    this.init();
  }

  init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        console.log('[Store] Loaded database from', DB_FILE);
        return;
      } catch (err) {
        console.error('[Store] Failed to parse database.json, re-seeding...', err.message);
      }
    }
    this.seed();
  }

  save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[Store] Error saving database:', err);
    }
  }

  seed() {
    console.log('[Store] Seeding database from', SAMPLE_DATA_FILE);
    let sample = { authors: [] };

    if (fs.existsSync(SAMPLE_DATA_FILE)) {
      sample = JSON.parse(fs.readFileSync(SAMPLE_DATA_FILE, 'utf8'));
    } else {
      console.error('[Store] Sample data file missing at', SAMPLE_DATA_FILE);
    }

    const defaultAuthorPassword = bcrypt.hashSync('author123', 10);
    const defaultAdminPassword = bcrypt.hashSync('admin123', 10);

    const authorsList = [];
    const booksList = [];

    sample.authors.forEach(auth => {
      authorsList.push({
        author_id: auth.author_id,
        name: auth.name,
        email: auth.email,
        password_hash: defaultAuthorPassword,
        phone: auth.phone,
        city: auth.city,
        joined_date: auth.joined_date,
        created_at: new Date(auth.joined_date).toISOString()
      });

      if (Array.isArray(auth.books)) {
        auth.books.forEach(b => {
          booksList.push({
            book_id: b.book_id,
            author_id: auth.author_id,
            title: b.title,
            isbn: b.isbn,
            genre: b.genre,
            publication_date: b.publication_date,
            status: b.status,
            mrp: b.mrp,
            author_royalty_per_copy: b.author_royalty_per_copy,
            total_copies_sold: b.total_copies_sold,
            total_royalty_earned: b.total_royalty_earned,
            royalty_paid: b.royalty_paid,
            royalty_pending: b.royalty_pending,
            last_royalty_payout_date: b.last_royalty_payout_date,
            print_partner: b.print_partner,
            available_on: b.available_on || []
          });
        });
      }
    });

    const adminsList = [
      {
        admin_id: 'ADMIN001',
        name: 'Saloni Mourya',
        email: 'saloni@bookleafpub.com',
        role: 'admin',
        title: 'Author Relations Lead',
        password_hash: defaultAdminPassword
      },
      {
        admin_id: 'ADMIN002',
        name: 'BookLeaf Ops Team',
        email: 'admin@bookleafpub.com',
        role: 'admin',
        title: 'Support Operations',
        password_hash: defaultAdminPassword
      }
    ];

    // Seed realistic sample tickets matching the official test scenarios in BookLeaf brief!
    const sampleTickets = [
      {
        ticket_id: 'TICK-1001',
        author_id: 'AUTH001', // Priya Sharma
        book_id: 'BK001', // Whispers of the Ganges
        subject: 'Royalty payout delayed for Whispers of the Ganges',
        description: 'I published my book 4 months ago and still haven\'t received any royalty. What\'s going on? My dashboard shows ₹3,570 pending.',
        category: 'Royalty & Payments',
        ai_category: 'Royalty & Payments',
        category_overridden: false,
        priority: 'High',
        ai_priority: 'High',
        priority_overridden: false,
        status: 'Open',
        assigned_to: 'ADMIN001',
        attachment: null,
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 2 days ago (shows urgent/oldest)
        updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      },
      {
        ticket_id: 'TICK-1002',
        author_id: 'AUTH007', // Sneha Kulkarni
        book_id: 'BK011', // The Algorithm of Love
        subject: 'Mismatched ISBN on Amazon India listing',
        description: 'My book is showing a different ISBN on Amazon than what is printed on the physical copy. Readers are reporting difficulty finding the official edition.',
        category: 'ISBN & Metadata Issues',
        ai_category: 'ISBN & Metadata Issues',
        category_overridden: false,
        priority: 'High',
        ai_priority: 'High',
        priority_overridden: false,
        status: 'In Progress',
        assigned_to: 'ADMIN001',
        attachment: null,
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      },
      {
        ticket_id: 'TICK-1003',
        author_id: 'AUTH004', // Vikram Joshi
        book_id: 'BK006', // Debugging Life
        subject: 'Defective author copies - Blurry pages and binding issues',
        description: 'I received my 10 author copies and the print quality is terrible. The images are blurry and the first 15 pages are noticeably misaligned.',
        category: 'Printing & Quality',
        ai_category: 'Printing & Quality',
        category_overridden: false,
        priority: 'High',
        ai_priority: 'High',
        priority_overridden: false,
        status: 'Open',
        assigned_to: 'Unassigned',
        attachment: 'proof_of_defect.jpg',
        created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
      },
      {
        ticket_id: 'TICK-1004',
        author_id: 'AUTH006', // Arjun Malhotra
        book_id: 'BK010', // Turban Tales
        subject: 'Listing shows Currently Unavailable on Amazon',
        description: 'My book is published but it is showing as "Currently Unavailable" on Amazon India today. Can you please check why?',
        category: 'Distribution & Availability',
        ai_category: 'Distribution & Availability',
        category_overridden: false,
        priority: 'Medium',
        ai_priority: 'Medium',
        priority_overridden: false,
        status: 'Resolved',
        assigned_to: 'ADMIN002',
        attachment: null,
        created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
      },
      {
        ticket_id: 'TICK-1005',
        author_id: 'AUTH009', // Kavita Deshmukh
        book_id: 'BK015', // Raising Roots (In Production - Typesetting)
        subject: 'Production progress update on Raising Roots',
        description: 'It has been 3 weeks and my book is still marked in typesetting. When will the proofs be completed?',
        category: 'Book Status & Production Updates',
        ai_category: 'Book Status & Production Updates',
        category_overridden: false,
        priority: 'Medium',
        ai_priority: 'Medium',
        priority_overridden: false,
        status: 'Open',
        assigned_to: 'Unassigned',
        attachment: null,
        created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
      },
      {
        ticket_id: 'TICK-1006',
        author_id: 'AUTH002', // Rohit Kapoor
        book_id: 'BK004', // Startup Sutra
        subject: 'Can I update the description and author bio on Amazon?',
        description: 'Can I update the description of my book on Amazon after it\'s already live? I have added endorsements from several founders that I\'d love to include.',
        category: 'General Inquiry',
        ai_category: 'General Inquiry',
        category_overridden: false,
        priority: 'Low',
        ai_priority: 'Low',
        priority_overridden: false,
        status: 'Closed',
        assigned_to: 'ADMIN001',
        attachment: null,
        created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
      }
    ];

    const sampleMessages = [
      {
        message_id: 'MSG-001',
        ticket_id: 'TICK-1001',
        sender_type: 'author',
        sender_id: 'AUTH001',
        sender_name: 'Priya Sharma',
        message: 'I published my book 4 months ago and still haven\'t received any royalty. What\'s going on? My dashboard shows ₹3,570 pending.',
        is_internal_note: false,
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      },
      {
        message_id: 'MSG-002',
        ticket_id: 'TICK-1002',
        sender_type: 'author',
        sender_id: 'AUTH007',
        sender_name: 'Sneha Kulkarni',
        message: 'My book is showing a different ISBN on Amazon than what is printed on the physical copy. Readers are reporting difficulty finding the official edition.',
        is_internal_note: false,
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        message_id: 'MSG-003',
        ticket_id: 'TICK-1002',
        sender_type: 'admin',
        sender_id: 'ADMIN001',
        sender_name: 'Saloni Mourya',
        message: 'Escalated to Repro India catalog ingestion unit. Amazon metadata refresh pushed with batch ID #REPRO-8812.',
        is_internal_note: true, // Internal Note example!
        created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
      },
      {
        message_id: 'MSG-004',
        ticket_id: 'TICK-1002',
        sender_type: 'admin',
        sender_id: 'ADMIN001',
        sender_name: 'Saloni Mourya',
        message: 'Dear Sneha, thank you for alerting us. We treat ISBN discrepancies as highest priority. We have initiated a direct catalog resync with Amazon Central and will confirm resolution within 48 hours.',
        is_internal_note: false,
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      },
      {
        message_id: 'MSG-005',
        ticket_id: 'TICK-1004',
        sender_type: 'author',
        sender_id: 'AUTH006',
        sender_name: 'Arjun Malhotra',
        message: 'My book is published but it is showing as "Currently Unavailable" on Amazon India today. Can you please check why?',
        is_internal_note: false,
        created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
      },
      {
        message_id: 'MSG-006',
        ticket_id: 'TICK-1004',
        sender_type: 'admin',
        sender_id: 'ADMIN002',
        sender_name: 'BookLeaf Ops Team',
        message: 'Hi Arjun, stock feed resync was completed yesterday with Amazon fulfillment centers. The listing is now fully active and back in stock!',
        is_internal_note: false,
        created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
      }
    ];

    this.data = {
      authors: authorsList,
      books: booksList,
      admins: adminsList,
      tickets: sampleTickets,
      ticket_messages: sampleMessages
    };

    this.save();
    console.log(`[Store] Seeded ${authorsList.length} authors, ${booksList.length} books, ${adminsList.length} admins, ${sampleTickets.length} tickets, and ${sampleMessages.length} messages.`);
  }

  // --- Authors ---
  findAuthorByEmail(email) {
    if (!email) return null;
    return this.data.authors.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  findAuthorById(id) {
    return this.data.authors.find(a => a.author_id === id);
  }

  getAllAuthors() {
    return this.data.authors.map(({ password_hash, ...rest }) => rest);
  }

  // --- Admins ---
  findAdminByEmail(email) {
    if (!email) return null;
    return this.data.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  findAdminById(id) {
    return this.data.admins.find(a => a.admin_id === id);
  }

  getAllAdmins() {
    return this.data.admins.map(({ password_hash, ...rest }) => rest);
  }

  // --- Books ---
  getBooksByAuthorId(authorId) {
    return this.data.books.filter(b => b.author_id === authorId);
  }

  getBookById(bookId) {
    return this.data.books.find(b => b.book_id === bookId);
  }

  getAllBooks() {
    return this.data.books;
  }

  // --- Tickets ---
  getTickets({ authorId, status, category, priority, sortBy, search } = {}) {
    let list = [...this.data.tickets];

    if (authorId) {
      list = list.filter(t => t.author_id === authorId);
    }
    if (status && status !== 'All') {
      list = list.filter(t => t.status === status);
    }
    if (category && category !== 'All') {
      list = list.filter(t => t.category === category);
    }
    if (priority && priority !== 'All') {
      list = list.filter(t => t.priority === priority);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t =>
        t.ticket_id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === 'oldest_unresolved') {
      // Unresolved tickets first, then oldest created_at
      list.sort((a, b) => {
        const aOpen = a.status !== 'Resolved' && a.status !== 'Closed';
        const bOpen = b.status !== 'Resolved' && b.status !== 'Closed';
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
        return new Date(a.created_at) - new Date(b.created_at);
      });
    } else if (sortBy === 'priority') {
      const pMap = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      list.sort((a, b) => (pMap[b.priority] || 0) - (pMap[a.priority] || 0));
    } else {
      // Default newest first
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return list;
  }

  getTicketById(ticketId) {
    return this.data.tickets.find(t => t.ticket_id === ticketId);
  }

  createTicket(ticketData) {
    const nextNum = 1000 + this.data.tickets.length + 1;
    const ticket = {
      ticket_id: `TICK-${nextNum}`,
      ...ticketData,
      status: 'Open',
      assigned_to: 'Unassigned',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.tickets.unshift(ticket);

    // Add initial message as the author's query
    const messageId = `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const author = this.findAuthorById(ticket.author_id);
    this.data.ticket_messages.push({
      message_id: messageId,
      ticket_id: ticket.ticket_id,
      sender_type: 'author',
      sender_id: ticket.author_id,
      sender_name: author?.name || 'Author',
      message: ticket.description,
      is_internal_note: false,
      created_at: ticket.created_at
    });

    this.save();
    return ticket;
  }

  updateTicket(ticketId, updates) {
    const idx = this.data.tickets.findIndex(t => t.ticket_id === ticketId);
    if (idx === -1) return null;

    const existing = this.data.tickets[idx];
    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.data.tickets[idx] = updated;
    this.save();
    return updated;
  }

  // --- Messages & Notes ---
  getTicketMessages(ticketId, { includeInternal = false } = {}) {
    return this.data.ticket_messages.filter(m => {
      if (m.ticket_id !== ticketId) return false;
      if (!includeInternal && m.is_internal_note) return false;
      return true;
    }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  addTicketMessage({ ticketId, senderType, senderId, senderName, message, isInternalNote = false }) {
    const msg = {
      message_id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticket_id: ticketId,
      sender_type: senderType,
      sender_id: senderId,
      sender_name: senderName,
      message,
      is_internal_note: Boolean(isInternalNote),
      created_at: new Date().toISOString()
    };
    this.data.ticket_messages.push(msg);

    // Update ticket updated_at
    const ticket = this.getTicketById(ticketId);
    if (ticket) {
      ticket.updated_at = msg.created_at;
      if (senderType === 'admin' && !isInternalNote && ticket.status === 'Open') {
        ticket.status = 'In Progress';
      }
    }

    this.save();
    return msg;
  }
}

module.exports = new Store();
