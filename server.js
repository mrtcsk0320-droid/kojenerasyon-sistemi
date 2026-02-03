const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import routes from backend folder
const authRoutes = require('./backend/routes/auth');
const productionRoutes = require('./backend/routes/production');
const userRoutes = require('./backend/routes/users');
const motorRoutes = require('./backend/routes/motors');
const energyRoutes = require('./backend/routes/energy');

const app = express();

// CORS configuration - Allow all origins for Vercel deployment
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080", "http://127.0.0.1:8080"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/motors', motorRoutes);
app.use('/api/energy', energyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// For Vercel serverless functions
module.exports = app;
