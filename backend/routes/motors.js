const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');
const { authenticateToken, checkPermissions } = require('../middleware/auth');

router.get('/', authenticateToken, checkPermissions('read'), async (req, res) => {
  try {
    const { motorId, startDate, endDate } = req.query;
    
    let data = await googleSheetsService.getMotorsData();
    
    if (motorId) {
      data = data.filter(item => item.motorId === motorId);
    }
    
    if (startDate) {
      data = data.filter(item => item.tarih >= startDate);
    }
    
    if (endDate) {
      data = data.filter(item => item.tarih <= endDate);
    }
    
    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Motor verileri alınamadı',
      error: error.message
    });
  }
});

router.get('/stats', authenticateToken, checkPermissions('read'), async (req, res) => {
  try {
    const data = await googleSheetsService.getMotorsData();
    const today = new Date().toISOString().split('T')[0];
    
    const motorStats = {
      'GM-1': calculateMotorStats(data, 'GM-1', today),
      'GM-2': calculateMotorStats(data, 'GM-2', today),
      'GM-3': calculateMotorStats(data, 'GM-3', today)
    };
    
    res.json({
      success: true,
      data: motorStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Motor istatistikleri alınamadı',
      error: error.message
    });
  }
});

router.post('/', authenticateToken, checkPermissions('write'), async (req, res) => {
  try {
    const { motorId, tarih, calismaSaatleri, uretimMWh, vardiya } = req.body;

    if (!motorId || !tarih || calismaSaatleri === undefined || uretimMWh === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Motor ID, tarih, çalışma saatleri ve üretim (MWh) gerekli'
      });
    }

    const motorData = {
      motorId,
      tarih,
      calismaSaatleri: parseFloat(calismaSaatleri),
      uretimMWh: parseFloat(uretimMWh),
      vardiya: vardiya || 'Sabah'
    };

    const result = await googleSheetsService.addMotorData(motorData);
    
    res.status(201).json({
      success: true,
      message: 'Motor verisi başarıyla eklendi',
      data: motorData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Motor verisi eklenemedi',
      error: error.message
    });
  }
});

function calculateMotorStats(data, motorId, today) {
  const motorData = data.filter(item => item.motorId === motorId);
  const todayData = motorData.filter(item => item.tarih === today);
  
  const totalHours = motorData.reduce((sum, item) => sum + item.calismaSaatleri, 0);
  const totalProduction = motorData.reduce((sum, item) => sum + item.uretimMWh, 0);
  const dailyHours = todayData.reduce((sum, item) => sum + item.calismaSaatleri, 0);
  const dailyProduction = todayData.reduce((sum, item) => sum + item.uretimMWh, 0);
  
  const avgProduction = motorData.length > 0 ? totalProduction / motorData.length : 0;
  
  return {
    motorId: motorId,
    totalHours: Math.round(totalHours * 100) / 100,
    totalProduction: Math.round(totalProduction * 100) / 100,
    dailyHours: Math.round(dailyHours * 100) / 100,
    dailyProduction: Math.round(dailyProduction * 100) / 100,
    avgProduction: Math.round(avgProduction * 100) / 100
  };
}

module.exports = router;
