const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple auth endpoint for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo users
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

// Energy hourly data endpoint
app.post('/api/energy/hourly', (req, res) => {
  try {
    const { sheetName, vardiya, data } = req.body;
    
    console.log('Energy data received:', { sheetName, vardiya, data });
    
    // Demo response - Google Sheets entegrasyonu olmadan
    res.json({
      success: true,
      message: `${sheetName} sayfasına ${data.length} saatlik veri başarıyla kaydedildi (Demo mod)`,
      savedCount: data.length,
      sheetName: sheetName,
      vardiya: vardiya
    });
  } catch (error) {
    console.error('Energy save error:', error);
    res.status(500).json({
      success: false,
      message: 'Kayıt sırasında hata oluştu'
    });
  }
});

// Create monthly sheets endpoint
app.post('/api/energy/create-monthly-sheets', (req, res) => {
  try {
    const { year } = req.body;
    
    console.log('Create monthly sheets request:', year);
    
    // Demo response
    const months = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 
                   'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
    
    res.json({
      success: true,
      message: `${year} yılı için ${months.length} aylık sayfa oluşturuldu (Demo mod)`,
      createdSheets: months.map(month => `${month} ${year}`)
    });
  } catch (error) {
    console.error('Create sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Sayfa oluşturma sırasında hata oluştu'
    });
  }
});

// Production data endpoint
app.get('/api/production', (req, res) => {
  try {
    // Demo production data
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
  } catch (error) {
    console.error('Production data error:', error);
    res.status(500).json({
      success: false,
      message: 'Veri alınamadı'
    });
  }
});

// For Vercel serverless functions
module.exports = app;
