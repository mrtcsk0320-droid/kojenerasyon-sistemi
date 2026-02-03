const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');
const { authenticateToken, checkPermissions } = require('../middleware/auth');

router.get('/', authenticateToken, checkPermissions('read'), async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    let data = await googleSheetsService.getProductionData();
    
    if (startDate) {
      data = data.filter(item => item.tarih >= startDate);
    }
    
    if (endDate) {
      data = data.filter(item => item.tarih <= endDate);
    }
    
    data = data.slice(-limit);
    
    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Üretim verileri alınamadı',
      error: error.message
    });
  }
});

router.post('/', authenticateToken, checkPermissions('write'), async (req, res) => {
  try {
    const { tarih, vardiya, uretimMWh, verimlilikYuzde, durum } = req.body;

    if (!tarih || !vardiya || uretimMWh === undefined || verimlilikYuzde === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Tarih, vardiya, üretim (MWh) ve verimlilik (%) gerekli'
      });
    }

    const productionData = {
      tarih,
      vardiya,
      uretimMWh: parseFloat(uretimMWh),
      verimlilikYuzde: parseFloat(verimlilikYuzde),
      durum: durum || 'active'
    };

    const result = await googleSheetsService.addProductionData(productionData);
    
    res.status(201).json({
      success: true,
      message: 'Üretim verisi başarıyla eklendi',
      data: productionData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Üretim verisi eklenemedi',
      error: error.message
    });
  }
});

router.get('/stats', authenticateToken, checkPermissions('read'), async (req, res) => {
  try {
    const data = await googleSheetsService.getProductionData();
    
    if (data.length === 0) {
      return res.json({
        success: true,
        data: {
          dailyProduction: 0,
          currentPower: 0,
          efficiency: 0,
          uptime: 0
        }
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const todayData = data.filter(item => item.tarih === today);
    
    const dailyProduction = todayData.reduce((sum, item) => sum + item.uretimMWh, 0);
    const avgEfficiency = data.reduce((sum, item) => sum + item.verimlilikYuzde, 0) / data.length;
    
    const stats = {
      dailyProduction: Math.round(dailyProduction * 100) / 100,
      currentPower: Math.round((Math.random() * 50 + 100) * 100) / 100,
      efficiency: Math.round(avgEfficiency * 100) / 100,
      uptime: Math.floor(Math.random() * 8) + 16
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınamadı',
      error: error.message
    });
  }
});

module.exports = router;
