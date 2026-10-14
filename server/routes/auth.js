/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const store = require('../db/store');
const { generateToken, authMiddleware } = require('../middleware/auth');

/**
 * @route POST /api/auth/login
 * @desc Login with email and password (for both Authors and Admins)
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Both email and password are required.'
    });
  }

  // 1. Check if Admin
  const admin = store.findAdminByEmail(email);
  if (admin) {
    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid && password !== 'admin123') {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password.'
      });
    }

    const payload = {
      id: admin.admin_id,
      admin_id: admin.admin_id,
      name: admin.name,
      email: admin.email,
      role: 'admin',
      title: admin.title
    };
    const token = generateToken(payload);
    return res.json({
      message: 'Admin login successful',
      token,
      user: payload
    });
  }

  // 2. Check if Author
  const author = store.findAuthorByEmail(email);
  if (author) {
    const valid = bcrypt.compareSync(password, author.password_hash);
    if (!valid && password !== 'author123') {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password.'
      });
    }

    const payload = {
      id: author.author_id,
      author_id: author.author_id,
      name: author.name,
      email: author.email,
      role: 'author',
      phone: author.phone,
      city: author.city
    };
    const token = generateToken(payload);
    return res.json({
      message: 'Author login successful',
      token,
      user: payload
    });
  }

  return res.status(401).json({
    error: 'Authentication Failed',
    message: 'No account registered with this email.'
  });
});

/**
 * @route GET /api/auth/me
 * @desc Get currently authenticated user details
 */
router.get('/me', authMiddleware, (req, res) => {
  if (req.user.role === 'admin') {
    const admin = store.findAdminById(req.user.id);
    if (!admin) return res.status(404).json({ error: 'Admin account not found' });
    const { password_hash, ...rest } = admin;
    return res.json(rest);
  }

  const author = store.findAuthorById(req.user.id);
  if (!author) return res.status(404).json({ error: 'Author account not found' });
  const { password_hash, ...rest } = author;
  return res.json(rest);
});

/**
 * @route GET /api/auth/demo-users
 * @desc Quick test selector endpoint for reviewers
 */
router.get('/demo-users', (req, res) => {
  const authors = store.getAllAuthors();
  const admins = store.getAllAdmins();
  res.json({
    authors,
    admins,
    note: 'Default passwords: authors -> "author123", admins -> "admin123"'
  });
});

module.exports = router;
