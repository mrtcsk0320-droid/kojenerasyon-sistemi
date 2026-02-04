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
const energyRoutes = require('./routes/energy');

const app = express();

// CORS configuration - Allow frontend access
app.use(cors({
  origin: ['http://localhost:8113', 'http://127.0.0.1:8113', 'http://localhost:8112', 'http://127.0.0.1:8112', 'http://localhost:8111', 'http://127.0.0.1:8111', 'http://localhost:8110', 'http://127.0.0.1:8110', 'http://localhost:8081', 'http://127.0.0.1:8081', 'http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:8105', 'http://127.0.0.1:8105', 'http://localhost:8104', 'http://127.0.0.1:8104', 'http://localhost:8103', 'http://127.0.0.1:8103', 'http://localhost:8102', 'http://127.0.0.1:8102', 'http://localhost:8101', 'http://127.0.0.1:8101', 'http://localhost:8100', 'http://127.0.0.1:8100', 'http://localhost:8099', 'http://127.0.0.1:8099', 'http://localhost:8098', 'http://127.0.0.1:8098', 'http://localhost:8097', 'http://127.0.0.1:8097', 'http://localhost:8096', 'http://127.0.0.1:8096', 'http://localhost:8095', 'http://127.0.0.1:8095', 'http://localhost:8094', 'http://127.0.0.1:8094', 'http://localhost:8093', 'http://127.0.0.1:8093', 'http://localhost:8092', 'http://127.0.0.1:8092', 'http://localhost:8091', 'http://127.0.0.1:8091', 'http://localhost:8090', 'http://127.0.0.1:8090', 'http://localhost:8089', 'http://127.0.0.1:8089', 'http://localhost:8088', 'http://127.0.0.1:8088', 'http://localhost:8087', 'http://127.0.0.1:8087', 'http://localhost:8086', 'http://127.0.0.1:8086', 'http://localhost:8084', 'http://127.0.0.1:8084', 'http://localhost:3000', 'http://127.0.0.1:3000', 'file://'],
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
app.use('/api/energy', dataLimiter, energyRoutes);

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
