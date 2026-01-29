// Google Sheets API Entegrasyonu
class GoogleSheetsAPI {
    constructor() {
        this.apiKey = 'YOUR_API_KEY_HERE'; // Google Cloud Console'dan alacağınız API anahtarı
        this.spreadsheetId = 'YOUR_SPREADSHEET_ID_HERE'; // Google Sheets ID
        this.baseURL = 'https://sheets.googleapis.com/v4/spreadsheets';
    }

    // API anahtarını ayarla
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    // Spreadsheet ID'yi ayarla
    setSpreadsheetId(spreadsheetId) {
        this.spreadsheetId = spreadsheetId;
    }

    normalizeRole(role) {
        return (role || '').toString().trim().toUpperCase();
    }

    parseActive(value) {
        if (value === undefined || value === null || value === '') return true;
        return value.toString().trim().toLowerCase() === 'true';
    }

    async sha256Hex(input) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(input);
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async passwordMatches(storedPassword, providedPassword) {
        if (!storedPassword) return false;

        const stored = storedPassword.toString().trim();
        const provided = (providedPassword ?? '').toString();

        if (stored === provided) return true;

        const parts = stored.split(':');
        if (parts.length < 2) return false;

        const salt = parts[0];
        const expectedHash = parts.slice(1).join(':').trim().toLowerCase();

        const hash1 = await this.sha256Hex(`${salt}${provided}`);
        if (hash1 === expectedHash) return true;

        const hash2 = await this.sha256Hex(`${provided}${salt}`);
        return hash2 === expectedHash;
    }

    // Genel API isteği gönder
    async makeRequest(endpoint, method = 'GET', data = null) {
        if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE' || !this.spreadsheetId || this.spreadsheetId === 'YOUR_SPREADSHEET_ID_HERE') {
            throw new Error('Google Sheets yapılandırması eksik. js/google-sheets.js içinde apiKey ve spreadsheetId değerlerini girin (constructor satırları).');
        }
        const url = `${this.baseURL}/${this.spreadsheetId}/${endpoint}?key=${this.apiKey}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Google Sheets API hatası:', error);
            throw error;
        }
    }

    // Veri oku
    async readData(range) {
        try {
            const result = await this.makeRequest(`values/${range}`);
            return result.values || [];
        } catch (error) {
            console.error('Veri okuma hatası:', error);
            throw error;
        }
    }

    // Veri yaz
    async writeData(range, values) {
        const data = {
            values: values
        };

        try {
            const result = await this.makeRequest(`values/${range}?valueInputOption=USER_ENTERED`, 'PUT', data);
            return result;
        } catch (error) {
            console.error('Veri yazma hatası:', error);
            throw error;
        }
    }

    // Veri ekle
    async appendData(range, values) {
        const data = {
            values: values
        };

        try {
            const result = await this.makeRequest(`values/${range}:append?valueInputOption=USER_ENTERED`, 'POST', data);
            return result;
        } catch (error) {
            console.error('Veri ekleme hatası:', error);
            throw error;
        }
    }

    // Dashboard verilerini getir
    async getDashboardData() {
        try {
            // Son günün verilerini al
            const today = new Date().toISOString().split('T')[0];
            const dataRange = `'VeriGiris'!A2:D1000`; // VeriGiris sayfasından verileri al
            
            const values = await this.readData(dataRange);
            
            // Verileri işle
            const dashboardData = {
                dailyProduction: 0,
                efficiency: 0,
                activeUsers: 0,
                totalEntries: values.length
            };

            if (values.length > 0) {
                // Son günün verilerini bul
                const todayData = values.filter(row => row[0] === today);
                
                if (todayData.length > 0) {
                    // Günlük üretim (toplam)
                    dashboardData.dailyProduction = todayData.reduce((sum, row) => sum + parseFloat(row[1] || 0), 0);
                    
                    // Verimlilik hesapla (üretim / yakıt * 100)
                    const totalProduction = dashboardData.dailyProduction;
                    const totalFuel = todayData.reduce((sum, row) => sum + parseFloat(row[2] || 0), 0);
                    dashboardData.efficiency = totalFuel > 0 ? ((totalProduction / totalFuel) * 100).toFixed(2) : 0;
                }
            }

            // Aktif kullanıcı sayısını al
            const users = await this.getUsers();
            dashboardData.activeUsers = users.filter(user => user.active).length;

            return dashboardData;
        } catch (error) {
            console.error('Dashboard verileri alınamadı:', error);
            return {
                dailyProduction: 0,
                efficiency: 0,
                activeUsers: 0,
                totalEntries: 0
            };
        }
    }

    // Veri girişi kaydet
    async saveDataEntry(formData) {
        try {
            const range = `'VeriGiris'!A:D`; // Tarih, Üretim, Yakıt, Saat sütunları
            const values = [[
                formData.date,
                formData.production.toString(),
                formData.fuel.toString(),
                formData.hours.toString()
            ]];

            const result = await this.appendData(range, values);
            return result;
        } catch (error) {
            console.error('Veri girişi kaydedilemedi:', error);
            throw error;
        }
    }

    // Rapor verilerini getir
    async getReportData() {
        try {
            const dataRange = `'VeriGiris'!A2:D1000`;
            const values = await this.readData(dataRange);

            const reportData = {
                totalProduction: 0,
                totalFuel: 0,
                totalHours: 0,
                avgEfficiency: 0,
                entries: values.length
            };

            if (values.length > 0) {
                values.forEach(row => {
                    reportData.totalProduction += parseFloat(row[1] || 0);
                    reportData.totalFuel += parseFloat(row[2] || 0);
                    reportData.totalHours += parseFloat(row[3] || 0);
                });

                // Ortalama verimlilik
                reportData.avgEfficiency = reportData.totalFuel > 0 
                    ? ((reportData.totalProduction / reportData.totalFuel) * 100).toFixed(2)
                    : 0;
            }

            return reportData;
        } catch (error) {
            console.error('Rapor verileri alınamadı:', error);
            return {
                totalProduction: 0,
                totalFuel: 0,
                totalHours: 0,
                avgEfficiency: 0,
                entries: 0
            };
        }
    }

    // Kullanıcıları getir
    async getUsers() {
        try {
            const usersRange = `'Kullanıcılar'!A2:E1000`;
            const values = await this.readData(usersRange);

            const users = values.map(row => ({
                email: row[0] || '',
                role: this.normalizeRole(row[1] || ''),
                password: row[2] || '',
                name: row[3] || '',
                active: this.parseActive(row[4])
            }));

            return users;
        } catch (error) {
            console.error('Kullanıcılar alınamadı:', error);
            return [];
        }
    }

    // Yeni kullanıcı ekle
    async addUser(userData) {
        try {
            const range = `'Kullanıcılar'!A:E`;
            const values = [[
                userData.email,
                this.normalizeRole(userData.role),
                userData.password, // Gerçek uygulamada hash'lenmiş olmalı
                userData.name,
                userData.active ? 'true' : 'false'
            ]];

            const result = await this.appendData(range, values);
            return result;
        } catch (error) {
            console.error('Kullanıcı eklenemedi:', error);
            throw error;
        }
    }

    // Kullanıcı doğrula
    async validateUser(email, password) {
        try {
            const users = await this.getUsers();
            const normalizedEmail = (email || '').toString().trim().toLowerCase();
            const user = users.find(u => (u.email || '').toString().trim().toLowerCase() === normalizedEmail);
            
            if (user && user.active && await this.passwordMatches(user.password, password)) {
                // Şifreyi güvenlik için kaldır
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }
            
            return null;
        } catch (error) {
            console.error('Kullanıcı doğrulanamadı:', error);
            throw error;
        }
    }

    // Ayarları getir
    async getSettings() {
        try {
            const settingsRange = `'Ayarlar'!A2:B100`;
            const values = await this.readData(settingsRange);

            const settings = {};
            values.forEach(row => {
                if (row[0] && row[1]) {
                    settings[row[0]] = row[1];
                }
            });

            return settings;
        } catch (error) {
            console.error('Ayarlar alınamadı:', error);
            return {};
        }
    }

    // Ayarları güncelle
    async updateSettings(settings) {
        try {
            const range = `'Ayarlar'!A:B`;
            const values = Object.entries(settings).map(([key, value]) => [key, value]);

            const result = await this.writeData(range, values);
            return result;
        } catch (error) {
            console.error('Ayarlar güncellenemedi:', error);
            throw error;
        }
    }
}

// Google Sheets API örneği oluştur
const googleSheets = new GoogleSheetsAPI();

// Sayfa yüklendiğinde yapılandırmayı kontrol et
document.addEventListener('DOMContentLoaded', () => {
    // Local storage'dan ayarları yükle
    const savedApiKey = localStorage.getItem('googleApiKey');
    const savedSpreadsheetId = localStorage.getItem('spreadsheetId');

    if (savedApiKey) {
        googleSheets.setApiKey(savedApiKey);
    }

    if (savedSpreadsheetId) {
        googleSheets.setSpreadsheetId(savedSpreadsheetId);
    }
});
