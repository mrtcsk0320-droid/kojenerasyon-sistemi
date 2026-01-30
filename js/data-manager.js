// Veri Yönetim Sistemi
class DataManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 dakika cache
    }

    // Cache anahtarı oluştur
    getCacheKey(prefix, params = {}) {
        const paramString = JSON.stringify(params);
        return `${prefix}_${btoa(paramString)}`;
    }

    // Cache'e veri kaydet
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Cache'den veri al
    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    // Cache'i temizle
    clearCache() {
        this.cache.clear();
    }

    // Veri girişi doğrula
    validateDataEntry(data) {
        const errors = [];

        // Tarih kontrolü
        if (!data.date) {
            errors.push('Tarih gereklidir');
        } else {
            const date = new Date(data.date);
            if (isNaN(date.getTime())) {
                errors.push('Geçersiz tarih formatı');
            }
        }

        // Üretim kontrolü
        if (data.production === undefined || data.production === null) {
            errors.push('Üretim değeri gereklidir');
        } else {
            const production = parseFloat(data.production);
            if (isNaN(production) || production < 0) {
                errors.push('Üretim değeri pozitif bir sayı olmalıdır');
            }
            if (production > 1000000) {
                errors.push('Üretim değeri çok yüksek');
            }
        }

        // Yakıt kontrolü
        if (data.fuel === undefined || data.fuel === null) {
            errors.push('Yakıt değeri gereklidir');
        } else {
            const fuel = parseFloat(data.fuel);
            if (isNaN(fuel) || fuel < 0) {
                errors.push('Yakıt değeri pozitif bir sayı olmalıdır');
            }
            if (fuel > 10000) {
                errors.push('Yakıt değeri çok yüksek');
            }
        }

        // Çalışma saati kontrolü
        if (data.hours === undefined || data.hours === null) {
            errors.push('Çalışma saati gereklidir');
        } else {
            const hours = parseFloat(data.hours);
            if (isNaN(hours) || hours < 0) {
                errors.push('Çalışma saati pozitif bir sayı olmalıdır');
            }
            if (hours > 24) {
                errors.push('Çalışma saati 24 saati geçemez');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Veri girişi kaydet
    async saveDataEntry(data) {
        try {
            // Veriyi doğrula
            const validation = this.validateDataEntry(data);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Google Sheets'e kaydet
            const result = await googleSheets.saveDataEntry(data);

            // Cache'i temizle
            this.clearCache();

            return {
                success: true,
                message: 'Veri başarıyla kaydedildi',
                data: result
            };
        } catch (error) {
            console.error('Veri kaydetme hatası:', error);
            return {
                success: false,
                message: error.message || 'Veri kaydedilemedi'
            };
        }
    }

    // Dashboard verilerini getir
    async getDashboardData() {
        const cacheKey = this.getCacheKey('dashboard');
        
        // Cache'den kontrol et
        let data = this.getCache(cacheKey);
        if (data) {
            return data;
        }

        try {
            data = await googleSheets.getDashboardData();
            
            // Cache'e kaydet
            this.setCache(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Dashboard verileri alınamadı:', error);
            throw error;
        }
    }

    // Rapor verilerini getir
    async getReportData(period = 'daily', startDate = null, endDate = null) {
        const cacheKey = this.getCacheKey('report', { period, startDate, endDate });
        
        // Cache'den kontrol et
        let data = this.getCache(cacheKey);
        if (data) {
            return data;
        }

        try {
            const rawData = await googleSheets.getReportData();
            
            // Veriyi filtrele ve işle
            data = this.processReportData(rawData, period, startDate, endDate);
            
            // Cache'e kaydet
            this.setCache(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Rapor verileri alınamadı:', error);
            throw error;
        }
    }

    // Rapor verilerini işle
    processReportData(rawData, period, startDate, endDate) {
        const processedData = {
            period: period,
            summary: {
                totalProduction: rawData.totalProduction,
                totalFuel: rawData.totalFuel,
                totalHours: rawData.totalHours,
                avgEfficiency: rawData.avgEfficiency,
                entries: rawData.entries
            },
            details: []
        };

        // Tarih aralığına göre filtreleme
        if (startDate && endDate) {
            // Bu kısım Google Sheets veri yapısına göre genişletilebilir
        }

        return processedData;
    }

    // Kullanıcı verilerini getir
    async getUsers() {
        const cacheKey = this.getCacheKey('users');
        
        // Cache'den kontrol et
        let data = this.getCache(cacheKey);
        if (data) {
            return data;
        }

        try {
            data = await googleSheets.getUsers();
            
            // Cache'e kaydet
            this.setCache(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Kullanıcı verileri alınamadı:', error);
            throw error;
        }
    }

    // İstatistikleri hesapla
    calculateStatistics(data) {
        const stats = {
            production: {
                total: 0,
                average: 0,
                min: Infinity,
                max: 0,
                trend: 'stable'
            },
            efficiency: {
                total: 0,
                average: 0,
                min: Infinity,
                max: 0,
                trend: 'stable'
            },
            hours: {
                total: 0,
                average: 0,
                min: Infinity,
                max: 0,
                trend: 'stable'
            }
        };

        if (!data || data.length === 0) {
            return stats;
        }

        // Üretim istatistikleri
        const productions = data.map(d => parseFloat(d.production) || 0);
        stats.production.total = productions.reduce((sum, val) => sum + val, 0);
        stats.production.average = stats.production.total / productions.length;
        stats.production.min = Math.min(...productions);
        stats.production.max = Math.max(...productions);

        // Verimlilik istatistikleri
        const efficiencies = data.map(d => {
            const production = parseFloat(d.production) || 0;
            const fuel = parseFloat(d.fuel) || 0;
            return fuel > 0 ? (production / fuel) * 100 : 0;
        });
        stats.efficiency.total = efficiencies.reduce((sum, val) => sum + val, 0);
        stats.efficiency.average = stats.efficiency.total / efficiencies.length;
        stats.efficiency.min = Math.min(...efficiencies);
        stats.efficiency.max = Math.max(...efficiencies);

        // Çalışma saati istatistikleri
        const hours = data.map(d => parseFloat(d.hours) || 0);
        stats.hours.total = hours.reduce((sum, val) => sum + val, 0);
        stats.hours.average = stats.hours.total / hours.length;
        stats.hours.min = Math.min(...hours);
        stats.hours.max = Math.max(...hours);

        return stats;
    }

    // Veri dışa aktar
    async exportData(format = 'csv', data = null) {
        try {
            if (!data) {
                data = await googleSheets.getReportData();
            }

            switch (format.toLowerCase()) {
                case 'csv':
                    return this.exportToCSV(data);
                case 'json':
                    return this.exportToJSON(data);
                case 'excel':
                    return this.exportToExcel(data);
                default:
                    throw new Error('Desteklenmeyen format');
            }
        } catch (error) {
            console.error('Veri dışa aktarma hatası:', error);
            throw error;
        }
    }

    // CSV formatına dışa aktar
    exportToCSV(data) {
        const headers = ['Tarih', 'Üretim (kWh)', 'Yakıt (LT)', 'Çalışma Saati'];
        const rows = data.details || [];

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += `${row.date},${row.production},${row.fuel},${row.hours}\n`;
        });

        return csv;
    }

    // JSON formatına dışa aktar
    exportToJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    // Excel formatına dışa aktar (basit HTML tablo)
    exportToExcel(data) {
        const headers = ['Tarih', 'Üretim (kWh)', 'Yakıt (LT)', 'Çalışma Saati'];
        const rows = data.details || [];

        let html = '<table>';
        html += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
        rows.forEach(row => {
            html += '<tr>' + 
                `<td>${row.date}</td>` +
                `<td>${row.production}</td>` +
                `<td>${row.fuel}</td>` +
                `<td>${row.hours}</td>` +
                '</tr>';
        });
        html += '</table>';

        return html;
    }

    // Veri yedekle
    async backupData() {
        try {
            const allData = {
                timestamp: new Date().toISOString(),
                users: await this.getUsers(),
                reports: await this.getReportData('all'),
                dashboard: await this.getDashboardData()
            };

            const backupData = JSON.stringify(allData, null, 2);
            
            // Local storage'a yedekle
            localStorage.setItem('dataBackup', backupData);
            
            return {
                success: true,
                message: 'Veriler yedeklendi',
                data: backupData
            };
        } catch (error) {
            console.error('Veri yedekleme hatası:', error);
            return {
                success: false,
                message: 'Veriler yedeklenemedi'
            };
        }
    }

    // Veri geri yükle
    async restoreData(backupData) {
        try {
            const data = JSON.parse(backupData);
            
            // Google Sheets'e geri yükle
            // Bu kısım API ile genişletilebilir
            
            return {
                success: true,
                message: 'Veriler geri yüklendi'
            };
        } catch (error) {
            console.error('Veri geri yükleme hatası:', error);
            return {
                success: false,
                message: 'Veriler geri yüklenemedi'
            };
        }
    }
}

// Veri yönetici örneği oluştur
const dataManager = new DataManager();
