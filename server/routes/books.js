/**
 * Books API Routes
 * RBAC: Authors can view their own books; Admins can view all books.
 */

const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { authMiddleware } = require('../middleware/auth');

/**
 * @route GET /api/books
 * @desc Get books for current logged in author or all books if admin
 */
router.get('/', authMiddleware, (req, res) => {
  if (req.user.role === 'admin') {
    const { authorId } = req.query;
    if (authorId) {
      return res.json(store.getBooksByAuthorId(authorId));
    }
    return res.json(store.getAllBooks());
  }

  // Author only sees their own books
  const books = store.getBooksByAuthorId(req.user.id);
  res.json(books);
});

/**
 * @route GET /api/books/:id
 * @desc Get details of a single book with RBAC verification
 */
router.get('/:id', authMiddleware, (req, res) => {
  const book = store.getBookById(req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Not Found', message: 'Book not found' });
  }

  // Author can only see their own book
  if (req.user.role === 'author' && book.author_id !== req.user.id) {
    return res.status(403).json({ error: 'Access Denied', message: 'You can only view your own books.' });
  }

  res.json(book);
});

module.exports = router;
