/**
 * Support Tickets API Routes
 * Handles ticket lifecycle, AI classification & drafting, messaging, and real-time sync
 */

const express = require('express');
const router = express.Router();
const store = require('../db/store');
const aiService = require('../services/aiService');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

/**
 * Helper to emit socket events if io instance is attached to app
 */
function emitSocket(req, event, data) {
  const io = req.app.get('io');
  if (io) {
    io.emit(event, data);
  }
}

/**
 * @route GET /api/tickets
 * @desc Get tickets (Author gets their own; Admin gets filtered list across all authors)
 */
router.get('/', authMiddleware, (req, res) => {
  const { status, category, priority, sortBy, search } = req.query;

  let authorId = null;
  if (req.user.role === 'author') {
    authorId = req.user.id;
  }

  const tickets = store.getTickets({
    authorId,
    status,
    category,
    priority,
    sortBy,
    search
  });

  // Enrich with author name and book title for quick display
  const enriched = tickets.map(t => {
    const author = store.findAuthorById(t.author_id);
    const book = t.book_id ? store.getBookById(t.book_id) : null;
    return {
      ...t,
      author_name: author ? author.name : 'Unknown Author',
      author_email: author ? author.email : '',
      book_title: book ? book.title : (t.book_id === 'GENERAL' || !t.book_id ? 'General / Account Level' : t.book_id)
    };
  });

  res.json(enriched);
});

/**
 * @route GET /api/tickets/:id
 * @desc Get ticket details, thread messages, author context, and AI suggestions
 */
router.get('/:id', authMiddleware, (req, res) => {
  const ticket = store.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Not Found', message: 'Ticket not found' });
  }

  // RBAC: Author can only view their own ticket
  if (req.user.role === 'author' && ticket.author_id !== req.user.id) {
    return res.status(403).json({ error: 'Access Denied', message: 'You can only view your own support tickets.' });
  }

  const author = store.findAuthorById(ticket.author_id);
  const book = ticket.book_id ? store.getBookById(ticket.book_id) : null;

  // Internal notes: only include if requester is admin!
  const includeInternal = req.user.role === 'admin';
  const messages = store.getTicketMessages(ticket.ticket_id, { includeInternal });

  res.json({
    ...ticket,
    author: author ? {
      author_id: author.author_id,
      name: author.name,
      email: author.email,
      phone: author.phone,
      city: author.city,
      joined_date: author.joined_date
    } : null,
    book: book || null,
    messages
  });
});

/**
 * @route POST /api/tickets
 * @desc Create a new ticket (Author raises ticket, AI classifies & sets priority & drafts response)
 */
router.post('/', authMiddleware, async (req, res) => {
  const { book_id, subject, description, attachment } = req.body;

  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Subject line is required.' });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Detailed description is required.' });
  }

  const authorId = req.user.role === 'author' ? req.user.id : req.body.author_id;
  if (!authorId) {
    return res.status(400).json({ error: 'Validation Error', message: 'Author ID is required.' });
  }

  const author = store.findAuthorById(authorId);
  const book = book_id && book_id !== 'GENERAL' ? store.getBookById(book_id) : null;

  // 1. AI Auto-Classification
  const classification = aiService.classifyTicket(subject, description);

  // 2. AI Priority Scoring
  const priorityResult = aiService.calculatePriority(subject, description, classification.category, book);

  // 3. AI Grounded Draft Generation
  let aiDraftResult = { draft: '', model: 'Pending', isFallback: true };
  try {
    aiDraftResult = await aiService.generateDraftResponse({
      author,
      book,
      subject,
      description,
      category: classification.category
    });
  } catch (err) {
    console.error('[Tickets Route] AI Draft Generation failed gracefully:', err);
    aiDraftResult = {
      draft: 'Draft could not be automatically generated. You can write your response below.',
      model: 'None (Degraded Mode)',
      isFallback: true
    };
  }

  // 4. Create Ticket in Store
  const newTicket = store.createTicket({
    author_id: authorId,
    book_id: book_id || 'GENERAL',
    subject: subject.trim(),
    description: description.trim(),
    category: classification.category,
    ai_category: classification.category,
    category_overridden: false,
    priority: priorityResult.priority,
    ai_priority: priorityResult.priority,
    priority_overridden: false,
    attachment: attachment || null,
    ai_draft_response: aiDraftResult.draft,
    ai_draft_model: aiDraftResult.model,
    ai_classification_reason: classification.reason,
    ai_priority_reason: priorityResult.reason
  });

  const enrichedTicket = {
    ...newTicket,
    author_name: author?.name || 'Author',
    author_email: author?.email || '',
    book_title: book?.title || 'General / Account Level'
  };

  // 5. Emit real-time WebSocket event
  emitSocket(req, 'ticket:created', enrichedTicket);

  res.status(201).json(enrichedTicket);
});

/**
 * @route POST /api/tickets/:id/messages
 * @desc Add a reply message or internal note to a ticket
 */
router.post('/:id/messages', authMiddleware, (req, res) => {
  const { message, is_internal_note } = req.body;
  const ticketId = req.params.id;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Message content cannot be empty.' });
  }

  const ticket = store.getTicketById(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Not Found', message: 'Ticket not found' });
  }

  // Authors cannot view or create internal notes
  const isInternal = Boolean(is_internal_note && req.user.role === 'admin');

  if (req.user.role === 'author') {
    if (ticket.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Access Denied', message: 'You cannot reply to someone else\'s ticket.' });
    }
  }

  const senderType = req.user.role === 'admin' ? 'admin' : 'author';
  const senderId = req.user.id;
  const senderName = req.user.name || (req.user.role === 'admin' ? 'BookLeaf Support Team' : 'Author');

  const newMsg = store.addTicketMessage({
    ticketId,
    senderType,
    senderId,
    senderName,
    message: message.trim(),
    isInternalNote: isInternal
  });

  // Emit WebSocket event for real-time delivery
  emitSocket(req, 'ticket:message_added', {
    ticket_id: ticketId,
    message: newMsg,
    updated_at: newMsg.created_at
  });

  res.status(201).json(newMsg);
});

/**
 * @route PATCH /api/tickets/:id
 * @desc Update ticket status, override AI category, override AI priority, or assign admin
 */
router.patch('/:id', authMiddleware, requireAdmin, (req, res) => {
  const { status, category, priority, assigned_to } = req.body;
  const ticketId = req.params.id;

  const ticket = store.getTicketById(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Not Found', message: 'Ticket not found' });
  }

  const updates = {};

  if (status && ['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
    updates.status = status;
  }

  if (category && category !== ticket.category) {
    updates.category = category;
    updates.category_overridden = category !== ticket.ai_category;
  }

  if (priority && priority !== ticket.priority) {
    updates.priority = priority;
    updates.priority_overridden = priority !== ticket.ai_priority;
  }

  if (assigned_to !== undefined) {
    updates.assigned_to = assigned_to;
  }

  const updatedTicket = store.updateTicket(ticketId, updates);

  // Emit WebSocket event
  emitSocket(req, 'ticket:updated', updatedTicket);

  res.json(updatedTicket);
});

/**
 * @route POST /api/tickets/:id/regenerate-ai-draft
 * @desc Regenerate AI draft response for a ticket on-demand (Admin only)
 */
router.post('/:id/regenerate-ai-draft', authMiddleware, requireAdmin, async (req, res) => {
  const ticket = store.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Not Found', message: 'Ticket not found' });
  }

  const author = store.findAuthorById(ticket.author_id);
  const book = ticket.book_id ? store.getBookById(ticket.book_id) : null;

  try {
    const aiResult = await aiService.generateDraftResponse({
      author,
      book,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category
    });

    const updated = store.updateTicket(ticket.ticket_id, {
      ai_draft_response: aiResult.draft,
      ai_draft_model: aiResult.model
    });

    emitSocket(req, 'ticket:updated', updated);

    res.json({
      message: 'AI Draft regenerated successfully',
      draft: aiResult.draft,
      model: aiResult.model
    });
  } catch (err) {
    res.status(500).json({ error: 'Generation Error', message: err.message });
  }
});

module.exports = router;
