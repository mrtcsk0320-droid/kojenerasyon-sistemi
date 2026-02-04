const express = require('express');
const cors = require('cors');
<<<<<<< HEAD

const app = express();

// CORS
=======
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
>>>>>>> 2b9143e268a60f1b90520ff005a1f4846c9fd9d6
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

<<<<<<< HEAD
=======
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

>>>>>>> 2b9143e268a60f1b90520ff005a1f4846c9fd9d6
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

<<<<<<< HEAD
// Health check
=======
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/motors', motorRoutes);
app.use('/api/energy', energyRoutes);

// Health check endpoint
>>>>>>> 2b9143e268a60f1b90520ff005a1f4846c9fd9d6
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

<<<<<<< HEAD
// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const users = [
    { email: 'admin@kojenerasyon.com', password: 'admin123', name: 'Admin User', role: 'Admin' },
    { email: 'operator@kojenerasyon.com', password: 'operator123', name: 'Operator', role: 'Operator' },
    { email: 'viewer@kojenerasyon.com', password: 'viewer123', name: 'Viewer', role: 'Viewer' }
  ];
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const token = 'demo-token-' + Date.now();
    res.json({ 
      success: true, 
      user: { id: 1, email: user.email, name: user.name, role: user.role },
      token 
    });
  } else {
    res.status(401).json({ success: false, message: 'E-posta veya şifre hatalı' });
  }
});

// Production
app.get('/api/production', (req, res) => {
  res.json({
    success: true,
    data: {
      dailyProduction: 360,
      currentPower: 104,
      efficiency: 84,
      uptime: 20,
      motors: [
        { id: 'GM-1', status: true, totalHours: 0, totalProduction: 0, dailyHours: 0, dailyProduction: 0, avgProduction: 0 },
        { id: 'GM-2', status: true, totalHours: 0, totalProduction: 0, dailyHours: 0, dailyProduction: 0, avgProduction: 0 },
        { id: 'GM-3', status: true, totalHours: 0, totalProduction: 0, dailyHours: 0, dailyProduction: 0, avgProduction: 0 }
      ]
    }
  });
});

// Energy hourly - Demo only
app.post('/api/energy/hourly', (req, res) => {
  const { sheetName, vardiya, data } = req.body;
  res.json({
    success: true,
    message: `${sheetName} sayfasına ${data.length} saatlik veri başarıyla kaydedildi (Demo mod)`,
    savedCount: data.length
  });
});

// Create monthly sheets - Demo only
app.post('/api/energy/create-monthly-sheets', (req, res) => {
  const { year } = req.body;
  const months = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 
                 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
  res.json({
    success: true,
    message: `${year} yılı için ${months.length} aylık sayfa oluşturuldu (Demo mod)`,
    createdSheets: months.map(month => `${month} ${year}`)
  });
});

=======
// For Vercel serverless functions
>>>>>>> 2b9143e268a60f1b90520ff005a1f4846c9fd9d6
module.exports = app;
