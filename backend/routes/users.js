const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');
const { authenticateToken, authorizeRoles, checkPermissions } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const users = await googleSheetsService.getUsers();
    
    const usersWithoutPasswords = users.map(user => ({
      id: user.id,
      ad: user.ad,
      email: user.email,
      rol: user.rol,
      aktif: user.aktif
    }));

    res.json({
      success: true,
      data: usersWithoutPasswords,
      count: usersWithoutPasswords.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar alınamadı',
      error: error.message
    });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const users = await googleSheetsService.getUsers();
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        ad: user.ad,
        email: user.email,
        rol: user.rol,
        aktif: user.aktif
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Profil alınamadı',
      error: error.message
    });
  }
});

module.exports = router;
