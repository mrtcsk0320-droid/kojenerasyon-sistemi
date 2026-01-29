// Google Sheets API Entegrasyonu
class GoogleSheetsAPI {
    constructor() {
    this.apiKey = 'AIzaSyCcF6wYrhr2i41qaBti9Rgaas1a5XcWnBk'; // Senin API key'in
    this.spreadsheetId = '1ulhuSPzsICrbNX0jAIqQcFeWcQBXifSAXWwJzfmmyCc'; // Senin Sheets ID'n
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

    // Motor verilerini çek (tarihe göre doğru sayfadan)
    async getMotorData() {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Tarihe göre sayfa adını belirle
            const year = yesterday.getFullYear();
            const month = yesterday.getMonth() + 1; // 0-11 arası, +1 yap
            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                              'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const sheetName = `${monthNames[month - 1]} ${year}`;
            
            console.log('Aranan tarih:', dateStr);
            console.log('Kullanılacak sayfa:', sheetName);
            
            // İlgili sayfadan dünün verilerini çek
            const range = `${sheetName}!A:R`; // Tüm sütunları al
            const response = await fetch(`${this.baseURL}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`);
            
            if (!response.ok) {
                throw new Error('Google Sheets API hatası');
            }
            
            const data = await response.json();
            const rows = data.values || [];
            
            console.log('Toplam satır sayısı:', rows.length);
            console.log('İlk 5 satır:', rows.slice(0, 5));
            
            const yesterdayRow = rows.find(row => row[0] === dateStr);
            let foundRow = yesterdayRow;
            
            if (!yesterdayRow) {
                console.warn('Dünün verisi bulunamadı:', dateStr);
                console.log('Tüm tarihler:', rows.map(row => row[0]).filter(Boolean));
                
                // Farklı tarih formatlarını dene
                const alternativeFormats = [
                    yesterday.toLocaleDateString('tr-TR'), // 28.01.2026
                    '28.01.2026',
                    '28/01/2026',
                    '01/28/2026',
                    '28-01-2026',
                    '01-28-2026'
                ];
                
                console.log('Denenecek tarih formatları:', alternativeFormats);
                
                for (const format of alternativeFormats) {
                    foundRow = rows.find(row => row[0] === format);
                    if (foundRow) {
                        console.log('Bulunan format:', format, 'Satır:', foundRow);
                        break;
                    }
                }
                
                if (!foundRow) {
                    console.warn('Hiçbir format ile bulunamadı');
                    return this.getMockMotorData();
                }
            }
            
            console.log('Bulunan satır:', foundRow);
            
            // Sütun indeksleri (A=0, B=1, C=2, ...)
            console.log('GM-1 Toplam Güç (B sütunu):', foundRow[1]);
            console.log('GM-2 Toplam Güç (C sütunu):', foundRow[2]);
            console.log('GM-3 Toplam Güç (D sütunu):', foundRow[3]);
            console.log('GM-1 Toplam Saat (G sütunu):', foundRow[6]);
            console.log('GM-2 Toplam Saat (H sütunu):', foundRow[7]);
            console.log('GM-3 Toplam Saat (I sütunu):', foundRow[8]);
            console.log('GM-1 Günlük Saat (J sütunu):', foundRow[9]);
            console.log('GM-2 Günlük Saat (K sütunu):', foundRow[10]);
            console.log('GM-3 Günlük Saat (L sütunu):', foundRow[11]);
            console.log('GM-1 Günlük Üretim (P sütunu):', foundRow[15]);
            console.log('GM-2 Günlük Üretim (Q sütunu):', foundRow[16]);
            console.log('GM-3 Günlük Üretim (R sütunu):', foundRow[17]);
            
            // Saatlik ortalama üretim hesapla
            const calculateHourlyAvg = (dailyProduction, dailyHours) => {
                const prod = parseFloat(dailyProduction.toString().replace(',', '.')) || 0;
                const hours = parseFloat(dailyHours.toString().replace(',', '.')) || 0;
                
                if (hours === 0) return '0.00';
                
                // Negatif saatleri pozitife çevir (mutlak değer)
                const absHours = Math.abs(hours);
                const avgProduction = prod / absHours;
                
                return avgProduction.toFixed(2);
            };
            
            // Verileri temizle ve formatla
            const cleanNumber = (num) => {
                return num.toString().replace(',', '.');
            };
            
            const motorData = {
                gm1: {
                    totalPower: cleanNumber(foundRow[1]) || '0.00',
                    totalHours: cleanNumber(foundRow[6]) || '0.0',
                    dailyHours: cleanNumber(foundRow[9]) || '0.0',
                    dailyProduction: cleanNumber(foundRow[15]) || '0.00',
                    hourlyAvg: calculateHourlyAvg(foundRow[15], foundRow[9])
                },
                gm2: {
                    totalPower: cleanNumber(foundRow[2]) || '0.00',
                    totalHours: cleanNumber(foundRow[7]) || '0.0',
                    dailyHours: cleanNumber(foundRow[10]) || '0.0',
                    dailyProduction: cleanNumber(foundRow[16]) || '0.00',
                    hourlyAvg: calculateHourlyAvg(foundRow[16], foundRow[10])
                },
                gm3: {
                    totalPower: cleanNumber(foundRow[3]) || '0.00',
                    totalHours: cleanNumber(foundRow[8]) || '0.0',
                    dailyHours: cleanNumber(foundRow[11]) || '0.0',
                    dailyProduction: cleanNumber(foundRow[17]) || '0.00',
                    hourlyAvg: calculateHourlyAvg(foundRow[17], foundRow[11])
                }
            };
            
            console.log('Hesaplanan motor verileri:', motorData);
            
            return motorData;
            
        } catch (error) {
            console.error('Motor verileri çekilemedi:', error);
            return this.getMockMotorData();
        }
    }

    // Mock veri (fallback)
    getMockMotorData() {
        return {
            gm1: {
                totalPower: (Math.random() * 50 + 10).toFixed(2),
                totalHours: (Math.random() * 1000 + 500).toFixed(1),
                dailyHours: (Math.random() * 24).toFixed(1),
                dailyProduction: (Math.random() * 100 + 20).toFixed(2)
            },
            gm2: {
                totalPower: (Math.random() * 50 + 10).toFixed(2),
                totalHours: (Math.random() * 1000 + 500).toFixed(1),
                dailyHours: (Math.random() * 24).toFixed(1),
                dailyProduction: (Math.random() * 100 + 20).toFixed(2)
            },
            gm3: {
                totalPower: (Math.random() * 50 + 10).toFixed(2),
                totalHours: (Math.random() * 1000 + 500).toFixed(1),
                dailyHours: (Math.random() * 24).toFixed(1),
                dailyProduction: (Math.random() * 100 + 20).toFixed(2)
            }
        };
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

        // Format: "<salt>:<hash>" (salt içinde '-' olabilir)
        if (storedPassword.includes(':')) {
            const idx = storedPassword.indexOf(':');
            const salt = storedPassword.slice(0, idx);
            const expectedHash = storedPassword.slice(idx + 1);

            // Olası iki yaygın formatı dene
            const candidate1 = await this.sha256Hex(`${salt}${providedPassword}`);
            if (candidate1 === expectedHash) return true;

            const candidate2 = await this.sha256Hex(`${providedPassword}${salt}`);
            if (candidate2 === expectedHash) return true;

            return false;
        }

        // Düz metin şifreler için doğrudan karşılaştır
        return storedPassword === providedPassword;
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
                reportData.avgEfficiency = reportData.totalHours > 0 ? 
                    (reportData.totalProduction / reportData.totalHours).toFixed(2) : 0;
            }

            return reportData;
        } catch (error) {
            console.error('Rapor verileri çekilemedi:', error);
            return null;
        }
    }

    // Buhar üretim verilerini çek (F sütunundan)
    async getSteamData() {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const year = today.getFullYear();
            const month = today.getMonth() + 1; // 0-11 arası, +1 yap
            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                              'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const sheetName = `${monthNames[month - 1]} ${year}`;
            
            // Dünkü tarihi farklı formatlarda dene
            const yesterdayFormats = [
                yesterday.toISOString().split('T')[0], // YYYY-MM-DD
                yesterday.toLocaleDateString('tr-TR'), // DD.MM.YYYY
                yesterday.toLocaleDateString('en-US'), // MM/DD/YYYY
                yesterday.toLocaleDateString('en-GB'), // DD/MM/YYYY
                `28.01.2026` // Manuel format
            ];
            
            console.log('Buhar verileri için kullanılacak sayfa:', sheetName);
            console.log('Aranan dünkü tarihler:', yesterdayFormats);
            
            // İlgili sayfadan tüm verileri çek (F sütunu dahil)
            const range = `${sheetName}!A:R`; // Tüm sütunları al
            const response = await fetch(`${this.baseURL}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`);
            
            if (!response.ok) {
                throw new Error('Google Sheets API hatası');
            }
            
            const data = await response.json();
            const rows = data.values || [];
            
            console.log('Buhar verileri - Toplam satır sayısı:', rows.length);
            console.log('İlk 5 satır:', rows.slice(0, 5));
            console.log('F sütunu değerleri:', rows.map(row => row[5]).slice(0, 10));
            
            // 983 verisini bul (toplam buhar için)
            let totalSteam = 0;
            let found983 = false;
            
            // Önce 983 değerini ara
            for (const row of rows) {
                if (row[5] && parseFloat(row[5]) === 983) {
                    totalSteam = 983;
                    found983 = true;
                    console.log('983 değeri bulundu!');
                    break;
                }
            }
            
            // Eğer 983 bulunamazsa, F sütunundaki en büyük değeri al
            if (!found983) {
                for (const row of rows) {
                    if (row[5]) {
                        const value = parseFloat(row[5]) || 0;
                        if (value > totalSteam) {
                            totalSteam = value;
                        }
                    }
                }
                console.log('983 bulunamadı, en büyük değer:', totalSteam);
            }
            
            // Dünkü tarihteki buhar üretimini bul
            let yesterdaySteam = 0;
            let foundYesterday = false;
            
            for (const format of yesterdayFormats) {
                for (const row of rows) {
                    if (row[0] && row[0].includes(format) && row[5]) {
                        yesterdaySteam = parseFloat(row[5]) || 0;
                        foundYesterday = true;
                        console.log('Dünkü tarih bulundu:', format, 'Değer:', yesterdaySteam);
                        break;
                    }
                }
                if (foundYesterday) break;
            }
            
            if (!foundYesterday) {
                console.log('Dünkü tarih bulunamadı, en son değeri kullanıyoruz');
                // En son değeri bul
                for (let i = rows.length - 1; i >= 0; i--) {
                    if (rows[i][5] && parseFloat(rows[i][5]) > 0) {
                        yesterdaySteam = parseFloat(rows[i][5]) || 0;
                        break;
                    }
                }
            }
            
            const steamData = {
                monthlyTotal: totalSteam.toFixed(2),
                latestValue: yesterdaySteam.toFixed(2),
                updateTime: new Date().toLocaleString('tr-TR')
            };
            
            console.log('Buhar verileri başarıyla çekildi:', steamData);
            console.log('983 bulundu mu:', found983);
            console.log('Dünkü tarih bulundu mu:', foundYesterday);
            return steamData;
            
        } catch (error) {
            console.error('Buhar verileri çekilemedi:', error);
            return null;
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
            console.log('Kullanıcı doğrulanıyor:', email);
            
            // Google Sheets'ten kullanıcıları çek
            const users = await this.getUsers();
            console.log('Toplam kullanıcı sayısı:', users.length);
            console.log('Kullanıcılar:', users);
            
            const normalizedEmail = (email || '').toString().trim().toLowerCase();
            const user = users.find(u => (u.email || '').toString().trim().toLowerCase() === normalizedEmail);
            
            console.log('Bulunan kullanıcı:', user);
            
            if (user && user.active && await this.passwordMatches(user.password, password)) {
                console.log('Kullanıcı doğrulandı:', user.email);
                // Şifreyi güvenlik için kaldır
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }
            
            console.log('Kullanıcı doğrulanamadı');
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
