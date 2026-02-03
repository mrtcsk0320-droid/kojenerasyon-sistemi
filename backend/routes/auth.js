const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'E-posta ve şifre gerekli'
      });
    }

    const result = await authService.login(email, password);
    
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { ad, email, password, rol } = req.body;

    if (!ad || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Ad, e-posta ve şifre gerekli'
      });
    }

    const result = await authService.register({ ad, email, password, rol });
    
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Token doğrulanamadı'
    });
  }
});

module.exports = router;
