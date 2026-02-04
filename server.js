const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();

// Google Sheets Authentication
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// CORS
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

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

// Energy hourly - Google Sheets entegrasyonu
app.post('/api/energy/hourly', async (req, res) => {
  try {
    const { sheetName, vardiya, data } = req.body;
    
    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      // Demo mod - Google Sheets ayarlanmamışsa
      return res.json({
        success: true,
        message: `${sheetName} sayfasına ${data.length} saatlik veri başarıyla kaydedildi (Demo mod)`,
        savedCount: data.length
      });
    }
    
    // Google Sheets'e veri yaz
    const values = data.map(item => [
      item.date,
      item.time,
      item.vardiya,
      item.aktif,
      item.reaktif,
      item.aydemAktif,
      item.aydemReaktif
    ]);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: `${sheetName}!A:G`,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
    
    res.json({
      success: true,
      message: `${sheetName} sayfasına ${data.length} saatlik veri başarıyla kaydedildi`,
      savedCount: data.length
    });
  } catch (error) {
    console.error('Google Sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Google Sheets kayıt hatası: ' + error.message
    });
  }
});

// Create monthly sheets
app.post('/api/energy/create-monthly-sheets', async (req, res) => {
  try {
    const { year } = req.body;
    const months = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 
                   'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
    
    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      // Demo mod
      return res.json({
        success: true,
        message: `${year} yılı için ${months.length} aylık sayfa oluşturuldu (Demo mod)`,
        createdSheets: months.map(month => `${month} ${year}`)
      });
    }
    
    // Google Sheets'te sayfaları oluştur
    const requests = months.map(month => ({
      addSheet: {
        properties: {
          title: `${month} ${year}`,
          gridProperties: { rowCount: 1000, columnCount: 10 }
        }
      }
    }));
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      resource: { requests }
    });
    
    res.json({
      success: true,
      message: `${year} yılı için ${months.length} aylık sayfa oluşturuldu`,
      createdSheets: months.map(month => `${month} ${year}`)
    });
  } catch (error) {
    console.error('Create sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Sayfa oluşturma hatası: ' + error.message
    });
  }
});

module.exports = app;
