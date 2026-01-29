// Google Sheets API Entegrasyonu
class GoogleSheetsAPI {
    constructor() {
    this.apiKey = 'AIzaSyCcF6wYrhr2i41qaBti9Rgaas1a5XcWnBk'; // Senin API key'in
    this.spreadsheetId = '1ulhuSPzsICrbNX0jAIqQcFeWcQBXifSAXWwJzfmmyCc'; // Senin Sheets ID'n
    this.baseURL = 'https://sheets.googleapis.com/v4/spreadsheets';
    
    // Test modu kapatıldı - API anahtarı kullanılacak
    this.testMode = false;
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
            throw new Error('Google Sheets yapılandırması eksik. Lütfen geçerli bir API anahtarı ve Spreadsheet ID girin.\n\nAPI anahtarı almak için:\n1. Google Cloud Console\'da proje oluşturun\n2. Google Sheets API\'yi etkinleştirin\n3. API anahtarı oluşturun\n4. js/google-sheets.js dosyasında apiKey ve spreadsheetId değerlerini güncelleyin');
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
            console.log('🔄 API isteği gönderiliyor:', method, url);
            const response = await fetch(url, options);
            
            console.log('📡 API yanıtı:', response.status, response.statusText);
            
            // 401 hatası için özel mesaj
            if (response.status === 401) {
                console.log('🔍 API anahtarı test ediliyor...');
                // API anahtarını test et
                const testResult = await this.testApiKey();
                
                if (testResult.issue === 'IP_REFERER_RESTRICTION') {
                    throw new Error('API anahtarı IP veya HTTP Referer kısıtlamasına sahip!\n\nÇözümler:\n1. Google Cloud Console\'dan API anahtarını düzenleyin\n2. "Uygulama kısıtlamaları" bölümünden IP adresi ve HTTP referer kısıtlamalarını kaldırın\n3. Veya localhost IP adresini (127.0.0.1) ekleyin\n\nGeçici çözüm: Veriler LocalStorage\'a kaydediliyor.');
                } else if (testResult.valid && !testResult.hasWritePermission) {
                    throw new Error('API anahtarı geçerli ama yazma izni yok!\n\nÇözümler:\n1. Google Cloud Console\'dan API anahtarını düzenleyin\n2. Google Sheets API yazma izinlerini ekleyin\n3. Spreadsheet\'i herkese açık yapın\n\nGeçici çözüm: Veriler LocalStorage\'a kaydediliyor.');
                } else {
                    throw new Error('API anahtarı geçersiz. Lütfen yeni bir API anahtarı oluşturun.\n\nGoogle Cloud Console\'da:\n1. Yeni API anahtarı oluşturun\n2. Google Sheets API\'yi etkinleştirin\n3. IP kısıtlamalarını kaldırın\n4. Bu anahtarı js/google-sheets.js dosyasına yapıştırın');
                }
            }
            
            // 403 hatası için özel mesaj  
            if (response.status === 403) {
                throw new Error('API erişim izni yok. Çözümler:\n1. Spreadsheet\'i "Herkesle paylaş" -> "İzleyici" yapın\n2. API anahtarına Google Sheets API yazma izni verin\n3. Spreadsheet ID\'nin doğru olduğundan emin olun\n4. "Saatlik_Enerji_Detay" sayfasının varlığını kontrol edin');
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Hata Detayı:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}\nDetay: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ API başarılı:', result);
            return result;
        } catch (error) {
            console.error('Google Sheets API hatası:', error);
            throw error;
        }
    }

    // API anahtarını test et
    async testApiKey() {
        try {
            console.log('🔍 API anahtarı test ediliyor...');
            
            // 1. Drive API test (genel erişim)
            const driveUrl = `https://www.googleapis.com/drive/v3/files?key=${this.apiKey}`;
            const driveResponse = await fetch(driveUrl);
            console.log('Drive API:', driveResponse.status);
            
            // 2. Sheets API test (okuma)
            const sheetsUrl = `${this.baseURL}/${this.spreadsheetId}?key=${this.apiKey}`;
            const sheetsResponse = await fetch(sheetsUrl);
            console.log('Sheets API (okuma):', sheetsResponse.status);
            
            // 3. Sheets API test (yazma denemesi)
            const writeUrl = `${this.baseURL}/${this.spreadsheetId}/values/Sheet1!A1:B1?valueInputOption=USER_ENTERED&key=${this.apiKey}`;
            const writeResponse = await fetch(writeUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ values: [['Test', 'Data']] })
            });
            console.log('Sheets API (yazma):', writeResponse.status);
            
            if (writeResponse.status === 403) {
                const errorText = await writeResponse.text();
                console.log('Yazma hatası detayı:', errorText);
                
                if (errorText.includes('origin') || errorText.includes('referer')) {
                    return { 
                        valid: true, 
                        hasReadPermission: true,
                        hasWritePermission: false,
                        issue: 'IP_REFERER_RESTRICTION',
                        message: 'API anahtarı IP veya HTTP Referer kısıtlamasına sahip. Localhost\'tan erişim engelleniyor.'
                    };
                }
            }
            
            return { 
                valid: driveResponse.status === 200,
                hasReadPermission: sheetsResponse.status === 200,
                hasWritePermission: writeResponse.status === 200
            };
        } catch (error) {
            console.error('API test hatası:', error);
            return { valid: false, error: error.message };
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
            // Önce mevcut verileri oku
            const existingData = await this.readData(range.replace('!A:H', '!A:H'));
            console.log('Mevcut veriler:', existingData.length, 'satır');
            
            // Yeni verileri mevcutlere ekle
            const allData = [...existingData, ...values];
            console.log('Toplam veri:', allData.length, 'satır');
            
            // Tüm verileri yaz
            const result = await this.makeRequest(`values/${range}?valueInputOption=USER_ENTERED`, 'PUT', { values: allData });
            return result;
        } catch (error) {
            console.error('Veri yazma hatası:', error);
            
            // Eğer yazma izni yoksa, appendData'yı dene
            if (error.message.includes('401') || error.message.includes('403')) {
                console.log('⚠️ Yazma izni yok, appendData deneniyor...');
                return await this.appendData(range, values);
            }
            
            throw error;
        }
    }

    // Veri ekle
    async appendData(range, values) {
        const data = {
            values: values
        };

        try {
            console.log('📝 Append işlemi başlatılıyor...');
            console.log('Range:', range);
            console.log('Values:', values);
            
            const endpoint = `values/${range}:append?valueInputOption=USER_ENTERED`;
            const result = await this.makeRequest(endpoint, 'POST', data);
            
            console.log('✅ Append başarılı:', result);
            return result;
        } catch (error) {
            console.error('❌ Veri ekleme hatası:', error);
            
            // Eğer append da çalışmazsa, son çare olarak LocalStorage'a kaydet
            if (error.message.includes('401') || error.message.includes('403')) {
                console.log('⚠️ Append de çalışmıyor, LocalStorage kullanılıyor...');
                throw new Error('API_YAZMA_IZNI_YOK');
            }
            
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

    // API izinlerini test et
    async testApiPermissions() {
        try {
            console.log('API izinleri test ediliyor...');
            
            // Spreadsheet bilgilerini al (okuma izni kontrolü)
            const testUrl = `${this.baseURL}/${this.spreadsheetId}?key=${this.apiKey}`;
            console.log('Test URL:', testUrl);
            
            const response = await fetch(testUrl);
            console.log('Response status:', response.status);
            
            if (response.status === 200) {
                const data = await response.json();
                console.log('✅ Google Sheets API çalışıyor');
                console.log('Spreadsheet sayfaları:', data.sheets?.map(s => s.properties.title));
                
                // Saatlik_Enerji_Detay sayfası var mı kontrol et
                const hasHourlyPage = data.sheets?.some(s => 
                    s.properties.title === 'Saatlik_Enerji_Detay'
                );
                
                if (!hasHourlyPage) {
                    console.warn('⚠️ "Saatlik_Enerji_Detay" sayfası bulunamadı!');
                    console.log('Mevcut sayfalar:', data.sheets?.map(s => s.properties.title));
                    console.log('💡 Çözüm: Google Sheets\'te "Saatlik_Enerji_Detay" adında yeni sayfa oluşturun');
                } else {
                    console.log('✅ "Saatlik_Enerji_Detay" sayfası bulundu');
                }
                
                return { success: true, data };
            } else {
                const errorText = await response.text();
                console.error('❌ API test hatası:', response.status, errorText);
                return { success: false, error: `HTTP ${response.status}: ${errorText}` };
            }
        } catch (error) {
            console.error('❌ API test exception:', error);
            return { success: false, error: error.message };
        }
    }

    // Saatlik enerji verilerini kaydet
    async saveHourlyData(formData) {
        try {
            console.log('Google Sheets kayıt başlatılıyor...');
            console.log('API Key:', this.apiKey ? 'Mevcut' : 'Yok');
            console.log('Spreadsheet ID:', this.spreadsheetId);
            
            // Önce sayfanın varlığını kontrol et
            const pageInfo = await this.checkSheetExists('Saatlik_Enerji_Detay');
            if (!pageInfo.exists) {
                throw new Error('"Saatlik_Enerji_Detay" sayfası bulunamadı! Mevcut sayfalar: ' + pageInfo.availableSheets.join(', '));
            }
            
            // Önce mevcut verileri oku
            const existingData = await this.readExistingHourlyData();
            console.log('Mevcut veriler okundu:', existingData.length, 'satır');
            
            // Kullanıcı bilgisini al
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userName = userData.name || 'Bilinmeyen Kullanıcı';
            
            // Yeni verileri hazırla
            const newRows = [];
            formData.hourlyData.forEach(hourData => {
                if (hourData.activePower > 0 || hourData.reactivePower > 0) {
                    newRows.push([
                        formData.date,                    // A: TARİH
                        hourData.hour,                     // B: SAAT
                        hourData.activePower.toString(),   // C: AKTİF
                        hourData.reactivePower.toString(), // D: REAKTİF
                        '',                               // E: BOŞ
                        '',                               // F: BOŞ
                        userName,                          // G: KULLANICI
                        new Date().toLocaleString('tr-TR') // H: KAYIT ZAMANI
                    ]);
                }
            });

            if (newRows.length === 0) {
                throw new Error('Kaydedilecek veri bulunamadı');
            }

            // Mevcut ve yeni verileri birleştir
            const allData = [...existingData, ...newRows];
            console.log('Toplam veri:', allData.length, 'satır');

            // Tüm verileri writeData ile yaz (append yerine)
            const range = `'Saatlik_Enerji_Detay'!A:H`;
            const result = await this.writeData(range, allData);
            
            console.log('✅ Google Sheets kayıt başarılı:', result);
            return result;
        } catch (error) {
            console.error('❌ Google Sheets kayıt hatası detayı:', error);
            console.error('Hata mesajı:', error.message);
            throw error;
        }
    }

    // Mevcut saatlik verilerini oku
    async readExistingHourlyData() {
        try {
            const range = `'Saatlik_Enerji_Detay'!A:H`;
            const result = await this.readData(range);
            return result || [];
        } catch (error) {
            console.warn('Mevcut veriler okunamadı, boş liste döndürülüyor:', error.message);
            return [];
        }
    }

    // Sayfanın varlığını kontrol et
    async checkSheetExists(sheetName) {
        try {
            const testUrl = `${this.baseURL}/${this.spreadsheetId}?key=${this.apiKey}`;
            const response = await fetch(testUrl);
            
            if (response.status === 200) {
                const data = await response.json();
                const sheets = data.sheets || [];
                const sheetTitles = sheets.map(s => s.properties.title);
                
                return {
                    exists: sheetTitles.includes(sheetName),
                    availableSheets: sheetTitles
                };
            } else {
                return {
                    exists: false,
                    availableSheets: []
                };
            }
        } catch (error) {
            return {
                exists: false,
                availableSheets: []
            };
        }
    }

    // Kayıtlı tarihleri kontrol et ve sonraki boş tarihi bul
    async getNextAvailableDate() {
        try {
            const range = `'Saatlik_Enerji_Detay'!A:A`; // Sadece tarih sütunu
            const values = await this.readData(range);
            
            // Tüm tarihleri topla
            const dates = values.map(row => row[0]).filter(date => date && date.trim());
            
            // Bugünün tarihini al
            const today = new Date().toISOString().split('T')[0];
            
            // Eğer bugün kayıt yoksa bugünü döndür
            if (!dates.includes(today)) {
                return today;
            }
            
            // Sonraki günleri kontrol et
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            
            if (!dates.includes(tomorrowStr)) {
                return tomorrowStr;
            }
            
            // İleri günler için kontrol et (maksimum 30 gün)
            for (let i = 2; i <= 30; i++) {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + i);
                const futureDateStr = futureDate.toISOString().split('T')[0];
                
                if (!dates.includes(futureDateStr)) {
                    return futureDateStr;
                }
            }
            
            // Bulunamazsa bugünü döndür
            return today;
        } catch (error) {
            console.error('Tarih kontrolü yapılamadı:', error);
            // Hata durumunda bugünü döndür
            return new Date().toISOString().split('T')[0];
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
