/**
 * Main Backend Server for BookLeaf Author Support & Communication Portal
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const ticketRoutes = require('./routes/tickets');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io for Real-Time Event Sync
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Attach io to express app so routes can broadcast events
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.url.startsWith('/api/docs')) {
      console.log(`[HTTP] ${req.method} ${req.url} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Swagger Interactive API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'BookLeaf Support API Docs'
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/tickets', ticketRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BookLeaf Author Support Portal API',
    uptime_seconds: Math.floor(process.uptime()),
    features: {
      realtime_websockets: true,
      ai_classification: true,
      ai_priority_scoring: true,
      ai_response_drafting: true,
      knowledge_base_grounding: true,
      swagger_docs: '/api/docs'
    }
  });
});

// Serve Frontend in Production / All-In-One Mode
const clientDistPath = require('path').join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.startsWith('/socket.io')) {
      return res.sendFile(require('path').join(clientDistPath, 'index.html'));
    }
    next();
  });
  console.log('[Server] Serving pre-built client from', clientDistPath);
}

// Global Error Handler (meaningful JSON error instead of generic 500)
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.name || 'Server Error',
    message: err.message || 'An unexpected error occurred while processing your request.',
    timestamp: new Date().toISOString()
  });
});

// Socket.io Connection Management
io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  socket.on('join_ticket', (ticketId) => {
    socket.join(`ticket:${ticketId}`);
    console.log(`[WebSocket] Client ${socket.id} joined room ticket:${ticketId}`);
  });

  socket.on('leave_ticket', (ticketId) => {
    socket.leave(`ticket:${ticketId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🚀 BookLeaf Support API Server running on port ${PORT}`);
  console.log(`📚 Swagger API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`⚡ WebSocket Server active on port ${PORT}`);
  console.log('========================================================');
});
