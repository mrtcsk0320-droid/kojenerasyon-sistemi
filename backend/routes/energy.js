const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');
const { authenticateToken } = require('../middleware/auth');

// Saatlik enerji verilerini Google Sheets'e kaydet
router.post('/hourly', authenticateToken, async (req, res) => {
    try {
        const { sheetName, vardiya, data } = req.body;
        
        if (!sheetName || !vardiya || !data || data.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Eksik parametreler' 
            });
        }

        // Sayfanın var olup olmadığını kontrol et ve oluştur
        await googleSheetsService.ensureSheetExists(sheetName);
        
        // Başlıkları kontrol et ve gerekirse ekle
        await ensureEnergySheetHeaders(sheetName);
        
        // Verileri ekle
        const values = data.map(item => [
            item.date,
            item.time,
            item.vardiya,
            item.aktif,
            item.reaktif,
            item.aydemAktif,
            item.aydemReaktif,
            new Date().toLocaleString('tr-TR'), // Kayıt Saati
            req.user?.email || 'Bilinmeyen', // Kullanıcı
            '' // Notlar
        ]);
        
        // Mevcut verilerin sonuna ekle
        const existingRows = await getExistingRowCount(sheetName);
        const startRow = existingRows + 1;
        
        await googleSheetsService.appendValues(sheetName, `A${startRow}:J${startRow + values.length - 1}`, values);
        
        console.log(`${sheetName} sayfasına ${data.length} veri eklendi`);
        
        res.json({
            success: true,
            message: `${sheetName} sayfasına ${data.length} saatlik veri başarıyla kaydedildi`,
            data: {
                sheetName: sheetName,
                vardiya: vardiya,
                recordCount: data.length
            }
        });
        
    } catch (error) {
        console.error('Saatlik veri kaydetme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Enerji sayfası başlıklarını kontrol et
async function ensureEnergySheetHeaders(sheetName) {
    try {
        const existingData = await googleSheetsService.getValues(sheetName, 'A1:J1');
        
        if (!existingData || existingData.length === 0) {
            // Başlıkları ekle
            const headers = [
                ['TARİH', 'SAAT', 'VARDİYA', 'AKTİF (MWh)', 'REAKTİF (kVAh)', 'AYDEM AKTİF', 'AYDEM REAKTİF', 'KAYIT SAATİ', 'KULLANICI', 'NOTLAR']
            ];
            await googleSheetsService.updateValues(sheetName, 'A1:J1', headers);
            console.log(`${sheetName} sayfasına başlıklar eklendi`);
        }
    } catch (error) {
        console.error('Başlık kontrolü hatası:', error);
        throw error;
    }
}

// Mevcut satır sayısını al
async function getExistingRowCount(sheetName) {
    try {
        const existingData = await googleSheetsService.getValues(sheetName, 'A:A');
        return existingData ? existingData.length : 0;
    } catch (error) {
        return 0;
    }
}

// Aylık sayfaları oluştur (OCAK - ARALIK)
router.post('/create-monthly-sheets', authenticateToken, async (req, res) => {
    try {
        const { year } = req.body;
        const currentYear = year || new Date().getFullYear();
        
        const monthNames = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 
                           'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
        
        // Mevcut sayfaları al
        const existingSheets = await googleSheetsService.getAllSheets();
        const sheetsToCreate = [];
        
        // Oluşturulacak sayfaları belirle
        monthNames.forEach(month => {
            const sheetName = `${month} ${currentYear}`;
            if (!existingSheets.includes(sheetName)) {
                sheetsToCreate.push(sheetName);
            }
        });
        
        if (sheetsToCreate.length === 0) {
            return res.json({
                success: true,
                message: `${currentYear} yılı için tüm aylık sayfalar zaten mevcut`,
                sheets: existingSheets
            });
        }
        
        // Sayfaları oluştur
        for (const sheetName of sheetsToCreate) {
            await googleSheetsService.ensureSheetExists(sheetName);
            await ensureEnergySheetHeaders(sheetName);
        }
        
        console.log(`${sheetsToCreate.length} aylık sayfa oluşturuldu`);
        
        res.json({
            success: true,
            message: `${currentYear} yılı için ${sheetsToCreate.length} aylık sayfa başarıyla oluşturuldu`,
            createdSheets: sheetsToCreate,
            allSheets: [...existingSheets, ...sheetsToCreate]
        });
        
    } catch (error) {
        console.error('Aylık sayfa oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

module.exports = router;
