const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const authService = require('./services/authService');

const {
  generalLimiter,
  authLimiter,
  dataLimiter,
  errorHandler,
  notFoundHandler,
  requestLogger,
  corsOptions
} = require('./middleware/security');

const authRoutes = require('./routes/auth');
const productionRoutes = require('./routes/production');
const userRoutes = require('./routes/users');
const motorRoutes = require('./routes/motors');

const app = express();

// CORS configuration - Allow frontend access
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://127.0.0.1:3000', 'file://'],
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

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(requestLogger);

app.use(generalLimiter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Kojenerasyon Backend API çalışıyor',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/production', dataLimiter, productionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/motors', dataLimiter, motorRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    // Initialize Google Sheets tables
    const googleSheetsService = require('./services/googleSheetsService');
    
    // Create all required sheets
    const sheets = ['Users', 'Production', 'Maintenance', 'Motors'];
    for (const sheetName of sheets) {
      try {
        await googleSheetsService.ensureSheetExists(sheetName);
        console.log(`✅ Sheet ${sheetName} is ready`);
      } catch (error) {
        console.error(`❌ Error creating sheet ${sheetName}:`, error.message);
      }
    }
    
    await authService.initializeDefaultUsers();
    
    const server = app.listen(config.server.port, () => {
      console.log(`🚀 Kojenerasyon Backend API`);
      console.log(`📍 Port: ${config.server.port}`);
      console.log(`🌍 Environment: ${config.server.nodeEnv}`);
      console.log(`⏰ Start Time: ${new Date().toISOString()}`);
    });

    const gracefulShutdown = (signal) => {
      console.log(`\n📡 ${signal} signal received`);
      console.log('🔄 Closing server...');
      
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('❌ Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Server başlatılamadı:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
