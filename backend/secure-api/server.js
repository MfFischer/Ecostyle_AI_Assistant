const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security Configuration
const API_KEY = process.env.API_KEY || 'your-secure-api-key-here';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chat';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3004', 'https://your-frontend-domain.vercel.app'];

// Logger Configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-assistant-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Authentication Middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== API_KEY) {
    logger.warn('Unauthorized access attempt', { 
      ip: req.ip, 
      userAgent: req.get('User-Agent'),
      apiKey: apiKey ? 'provided' : 'missing'
    });
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Valid API key required' 
    });
  }
  
  next();
};

// Session Management
const sessions = new Map();

const createSession = () => {
  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    createdAt: new Date(),
    lastActivity: new Date(),
    messageCount: 0,
    language: null
  };
  sessions.set(sessionId, session);
  return session;
};

const getSession = (sessionId) => {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date();
    return session;
  }
  return null;
};

// Clean up old sessions (older than 24 hours)
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
      sessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

// Validation Middleware
const validateChatRequest = [
  body('message').optional().isString().isLength({ min: 1, max: 2000 }),
  body('type').isIn(['text', 'voice']),
  body('sessionId').optional().isUUID(),
  body('language').optional().isIn(['en', 'de', 'auto']),
  body('generateAudio').optional().isBoolean()
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

app.post('/api/session', authenticateApiKey, (req, res) => {
  try {
    const session = createSession();
    logger.info('New session created', { sessionId: session.id });
    res.json({ sessionId: session.id });
  } catch (error) {
    logger.error('Error creating session', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat', authenticateApiKey, validateChatRequest, async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { message, type, sessionId, language, generateAudio } = req.body;

    // Session handling
    let session;
    if (sessionId) {
      session = getSession(sessionId);
      if (!session) {
        return res.status(400).json({ 
          error: 'Invalid session', 
          message: 'Session not found or expired' 
        });
      }
    } else {
      session = createSession();
    }

    session.messageCount++;

    // Prepare request for n8n
    const n8nPayload = {
      message,
      type,
      sessionId: session.id,
      language,
      generateAudio,
      timestamp: new Date().toISOString(),
      clientInfo: {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    };

    logger.info('Forwarding request to n8n', { 
      sessionId: session.id, 
      type, 
      messageLength: message?.length || 0 
    });

    // Forward to n8n workflow
    const response = await axios.post(N8N_WEBHOOK_URL, n8nPayload, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Assistant-API/1.0'
      }
    });

    // Update session language if detected
    if (response.data.language) {
      session.language = response.data.language;
    }

    logger.info('Successful response from n8n', { 
      sessionId: session.id, 
      responseLength: response.data.message?.length || 0 
    });

    res.json({
      ...response.data,
      sessionId: session.id
    });

  } catch (error) {
    logger.error('Error processing chat request', {
      error: error.message,
      stack: error.stack,
      sessionId: req.body.sessionId
    });

    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ 
        error: 'Service unavailable', 
        message: 'AI service is temporarily unavailable' 
      });
    } else if (error.response) {
      res.status(error.response.status).json({ 
        error: 'AI service error', 
        message: error.response.data?.message || 'Unknown error' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        message: 'An unexpected error occurred' 
      });
    }
  }
});

// Voice upload endpoint
app.post('/api/chat/voice', authenticateApiKey, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No audio file provided' 
      });
    }

    const { sessionId, language } = req.body;

    // Session handling
    let session;
    if (sessionId) {
      session = getSession(sessionId);
      if (!session) {
        return res.status(400).json({ 
          error: 'Invalid session', 
          message: 'Session not found or expired' 
        });
      }
    } else {
      session = createSession();
    }

    // Convert buffer to base64 for n8n
    const audioBase64 = req.file.buffer.toString('base64');

    const n8nPayload = {
      type: 'voice',
      sessionId: session.id,
      language,
      audio: {
        data: audioBase64,
        mimeType: req.file.mimetype,
        filename: req.file.originalname || 'audio.wav'
      },
      timestamp: new Date().toISOString()
    };

    logger.info('Processing voice request', { 
      sessionId: session.id, 
      audioSize: req.file.size 
    });

    const response = await axios.post(N8N_WEBHOOK_URL, n8nPayload, {
      timeout: 60000, // 60 second timeout for voice processing
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json({
      ...response.data,
      sessionId: session.id
    });

  } catch (error) {
    logger.error('Error processing voice request', {
      error: error.message,
      sessionId: req.body.sessionId
    });

    res.status(500).json({ 
      error: 'Voice processing failed', 
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ 
      error: 'Payload too large', 
      message: 'Request size exceeds limit' 
    });
  }

  res.status(500).json({ 
    error: 'Internal server error', 
    message: 'An unexpected error occurred' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found', 
    message: 'The requested endpoint does not exist' 
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AI Assistant Secure API running on port ${PORT}`);
  logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔐 API Key authentication: ${API_KEY !== 'your-secure-api-key-here' ? 'Configured' : 'Using default (CHANGE THIS!)'}`);
});

module.exports = app;
