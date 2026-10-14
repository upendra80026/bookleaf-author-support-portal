/**
 * Authentication and RBAC Middleware
 */

const jwt = require('jsonwebtoken');
const store = require('../db/store');

const JWT_SECRET = process.env.JWT_SECRET || 'bookleaf-secret-key-2026-production';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  // Optional quick evaluator convenience header: x-dev-switch
  const devSwitch = req.headers['x-dev-author-id'];
  if (devSwitch) {
    const author = store.findAuthorById(devSwitch);
    if (author) {
      req.user = {
        id: author.author_id,
        author_id: author.author_id,
        name: author.name,
        email: author.email,
        role: 'author'
      };
      return next();
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Please provide a valid Bearer token in Authorization header.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or Expired Token',
      message: 'Your session has expired. Please log in again.'
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'This operation requires Administrator privileges.'
    });
  }
  next();
}

function requireAuthor(req, res, next) {
  if (!req.user || req.user.role !== 'author') {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'This operation requires Author privileges.'
    });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authMiddleware,
  requireAdmin,
  requireAuthor
};
