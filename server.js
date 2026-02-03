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

// For Vercel serverless functions
module.exports = app;
