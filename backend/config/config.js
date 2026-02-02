require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    serviceAccount: {
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  sheets: {
    productionSheetName: 'Production',
    usersSheetName: 'Users',
    maintenanceSheetName: 'Maintenance',
    motorsSheetName: 'Motors',
    ranges: {
      production: 'Production!A:E',
      users: 'Users!A:F',
      maintenance: 'Maintenance!A:D',
      motors: 'Motors!A:E'
    }
  }
};

const validateConfig = () => {
  const required = [
    'GOOGLE_SPREADSHEET_ID',
    'JWT_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    console.error('Please check your .env file');
    process.exit(1);
  }
};

if (config.server.nodeEnv === 'production') {
  validateConfig();
}

module.exports = config;
