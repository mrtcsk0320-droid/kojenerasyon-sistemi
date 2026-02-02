const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Çok fazla istek, lütfen daha sonra tekrar deneyin'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: message || 'Çok fazla istek, lütfen daha sonra tekrar deneyin',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

const generalLimiter = createRateLimiter(
  config.security.rateLimitWindowMs,
  config.security.rateLimitMaxRequests,
  'Genel istek limiti aşıldı'
);

const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  'Çok fazla giriş denemesi, lütfen 15 dakika sonra tekrar deneyin'
);

const dataLimiter = createRateLimiter(
  60 * 1000,
  30,
  'Veri işlem limiti aşıldı, lütfen daha sonra tekrar deneyin'
);

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Doğrulama hatası',
      error: err.message
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token süresi dolmuş'
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Hizmet kullanılamıyor'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : 'İç sunucu hatası'
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı',
    path: req.originalUrl
  });
};

const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const { method, originalUrl, ip } = req;
  const userAgent = req.get('User-Agent');
  
  console.log(`[${timestamp}] ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`);
  
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`[${timestamp}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
  });
  
  next();
};

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:8080', 'http://127.0.0.1:8080');
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = {
  generalLimiter,
  authLimiter,
  dataLimiter,
  errorHandler,
  notFoundHandler,
  requestLogger,
  corsOptions
};
