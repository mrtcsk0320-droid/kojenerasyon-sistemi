// Ana Uygulama Mantığı
class KojenerasyonApp {
    constructor() {
        this.currentPage = 'overview';
        this.userData = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.checkAuthentication();
            this.loadDashboardData();
        });
    }

    setupEventListeners() {
        const dataForm = document.getElementById('data-form');
        if (dataForm) {
            dataForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDataEntry();
            });
        }

        // Saatlik veri giriş formu
        const hourlyDataForm = document.getElementById('hourly-data-form');
        if (hourlyDataForm) {
            // Submit olayını engelle
            hourlyDataForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                console.log('Form submit engellendi, kaydetme başlatılıyor...');
                await this.saveHourlyDataEntry();
                
                return false;
            });
            
            // Buton için ayrı event listener ekle
            const submitBtn = hourlyDataForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    console.log('Buton tıklandı, kaydetme başlatılıyor...');
                    await this.saveHourlyDataEntry();
                    
                    return false;
                });
            }
        }

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    showSection(sectionName) {
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.remove('active'));

        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentPage = sectionName;
            this.updateMenuItems(sectionName);
            this.loadSectionData(sectionName);
        }

        const sectionTitle = document.getElementById('section-title');
        const sectionDescription = document.getElementById('section-description');
        
        const titles = {
            'overview': { title: 'Genel Bakış', description: 'Sistem genel durumu' },
            'data-entry': { title: 'Veri Girişi', description: 'Yeni veri ekle' },
            'reports': { title: 'Raporlar', description: 'Veri analizleri' },
            'users': { title: 'Kullanıcı Yönetimi', description: 'Kullanıcı işlemleri' },
            'settings': { title: 'Ayarlar', description: 'Sistem ayarları' }
        };

        if (titles[sectionName]) {
            sectionTitle.textContent = titles[sectionName].title;
            sectionDescription.textContent = titles[sectionName].description;
        }
    }

    updateMenuItems(activeSection) {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => item.classList.remove('active'));

        const sectionMap = {
            'overview': 0,
            'data-entry': 1,
            'reports': 2,
            'users': 3,
            'settings': 4
        };

        if (sectionMap[activeSection] !== undefined) {
            const items = document.querySelectorAll('.menu-item');
            if (items[sectionMap[activeSection]]) {
                items[sectionMap[activeSection]].classList.add('active');
            }
        }
    }

    loadSectionData(sectionName) {
        switch(sectionName) {
            case 'overview':
                this.loadDashboardData();
                break;
            case 'data-entry':
                this.loadDataEntryForm();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'users':
                this.loadUsers();
                break;
        }
    }

    async loadDashboardData() {
        try {
            console.log('📊 Dashboard verileri yükleniyor...');
            
            // Google Sheets'ten motor verilerini çek
            const sheetData = await googleSheets.getMotorData();
            
            const motorData = {
                gm1: {
                    hours: sheetData.gm1.totalHours || '0.0',
                    power: sheetData.gm1.totalPower || '0.00',
                    dailyHours: sheetData.gm1.dailyHours || '0.0',
                    dailyProduction: sheetData.gm1.dailyProduction || '0.00',
                    hourlyAvg: sheetData.gm1.hourlyAvg || '0.00'
                },
                gm2: {
                    hours: sheetData.gm2.totalHours || '0.0',
                    power: sheetData.gm2.totalPower || '0.00',
                    dailyHours: sheetData.gm2.dailyHours || '0.0',
                    dailyProduction: sheetData.gm2.dailyProduction || '0.00',
                    hourlyAvg: sheetData.gm2.hourlyAvg || '0.00'
                },
                gm3: {
                    hours: sheetData.gm3.totalHours || '0.0',
                    power: sheetData.gm3.totalPower || '0.00',
                    dailyHours: sheetData.gm3.dailyHours || '0.0',
                    dailyProduction: sheetData.gm3.dailyProduction || '0.00',
                    hourlyAvg: sheetData.gm3.hourlyAvg || '0.00'
                }
            };
            
            this.updateMotorCards(motorData);
            
            // Google Sheets'ten buhar verilerini çek
            const steamData = await googleSheets.getSteamData();
            
            if (steamData) {
                this.updateSteamCards(steamData);
            } else {
                // Mock buhar verisi
                const mockSteamData = {
                    monthlyTotal: (Math.random() * 2000 + 1000).toFixed(2),
                    latestDate: new Date(Date.now() - 86400000).toLocaleDateString('tr-TR'),
                    latestValue: (Math.random() * 100 + 50).toFixed(2),
                    updateTime: new Date().toLocaleString('tr-TR')
                };
                this.updateSteamCards(mockSteamData);
            }
            
            // LocalStorage'dan saatlik verileri oku ve dashboard'a yansıt
            this.loadHourlyDataToDashboard();
            
            // Admin ise düzenleme butonlarını göster
            this.checkAdminStatus();
            
            console.log('✅ Dashboard verileri yüklendi');
        } catch (error) {
            console.error('Dashboard verileri yüklenemedi:', error);
            // Hata durumunda LocalStorage verilerini göster
            this.loadHourlyDataToDashboard();
        }
    }

    // LocalStorage'daki saatlik verilerini dashboard'a yükle
    loadHourlyDataToDashboard() {
        try {
            const hourlyData = JSON.parse(localStorage.getItem('hourlyData') || '[]');
            console.log('📈 LocalStorage saatlik verileri:', hourlyData.length, 'kayıt');
            
            if (hourlyData.length > 0) {
                // Bugünün verilerini hesapla
                const today = new Date().toISOString().split('T')[0];
                const todayData = hourlyData.filter(data => data.date === today);
                
                // Toplam verileri hesapla
                const totalActivePower = hourlyData.reduce((sum, data) => sum + (data.totalActivePower || 0), 0);
                const totalReactivePower = hourlyData.reduce((sum, data) => sum + (data.totalReactivePower || 0), 0);
                
                // Dashboard kartlarını güncelle
                this.updateEnergyCards({
                    totalActivePower: totalActivePower.toFixed(2),
                    totalReactivePower: totalReactivePower.toFixed(2),
                    todayActivePower: todayData.reduce((sum, data) => sum + (data.totalActivePower || 0), 0).toFixed(2),
                    recordCount: hourlyData.length,
                    lastUpdate: hourlyData.length > 0 ? hourlyData[hourlyData.length - 1].timestamp : 'Henüz kayıt yok'
                });
                
                console.log('✅ Enerji kartları güncellendi:', {
                    totalActivePower: totalActivePower.toFixed(2),
                    totalReactivePower: totalReactivePower.toFixed(2),
                    todayRecords: todayData.length
                });
            } else {
                console.log('📝 Henüz kayıtlı veri yok');
            }
        } catch (error) {
            console.error('LocalStorage verileri okunamadı:', error);
        }
    }

    // Enerji kartlarını güncelle
    updateEnergyCards(data) {
        try {
            // Toplam Aktif Güç kartı
            const totalActiveElement = document.getElementById('total-active-power');
            if (totalActiveElement) {
                totalActiveElement.textContent = `${data.totalActivePower} MWh`;
            }
            
            // Toplam Reaktif Güç kartı
            const totalReactiveElement = document.getElementById('total-reactive-power');
            if (totalReactiveElement) {
                totalReactiveElement.textContent = `${data.totalReactivePower} kVAh`;
            }
            
            // Bugünkü üretim kartı
            const todayProductionElement = document.getElementById('today-production');
            if (todayProductionElement) {
                todayProductionElement.textContent = `${data.todayActivePower} MWh`;
            }
            
            // Kayıt sayısı kartı
            const recordCountElement = document.getElementById('record-count');
            if (recordCountElement) {
                recordCountElement.textContent = data.recordCount;
            }
            
            // Son güncelleme kartı
            const lastUpdateElement = document.getElementById('last-update');
            if (lastUpdateElement) {
                const updateDate = new Date(data.lastUpdate);
                lastUpdateElement.textContent = updateDate.toLocaleString('tr-TR');
            }
            
            console.log('✅ Enerji kartları güncellendi');
        } catch (error) {
            console.error('Enerji kartları güncellenemedi:', error);
        }
    }

    async loadMockData() {
        const mockData = {
            gm1: {
                hours: (Math.random() * 1000 + 500).toFixed(1),
                power: (Math.random() * 50 + 10).toFixed(2),
                dailyHours: (Math.random() * 24).toFixed(1),
                dailyProduction: (Math.random() * 100 + 20).toFixed(2),
                hourlyAvg: (Math.random() * 10 + 2).toFixed(2)
            },
            gm2: {
                hours: (Math.random() * 1000 + 500).toFixed(1),
                power: (Math.random() * 50 + 10).toFixed(2),
                dailyHours: (Math.random() * 24).toFixed(1),
                dailyProduction: (Math.random() * 100 + 20).toFixed(2),
                hourlyAvg: (Math.random() * 10 + 2).toFixed(2)
            },
            gm3: {
                hours: (Math.random() * 1000 + 500).toFixed(1),
                power: (Math.random() * 50 + 10).toFixed(2),
                dailyHours: (Math.random() * 24).toFixed(1),
                dailyProduction: (Math.random() * 100 + 20).toFixed(2),
                hourlyAvg: (Math.random() * 10 + 2).toFixed(2)
            }
        };
        
        this.updateMotorCards(mockData);
    }

    checkAdminStatus() {
        // Kullanıcının admin olup olmadığını kontrol et
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const isAdmin = userData.role === 'ADMIN' || userData.role === 'admin';
        
        // Geçici test için herkes admin olsun
        const testMode = false; // Bunu false yapınca normal döner
        
        console.log('Kullanıcı rolü:', userData.role);
        console.log('Admin mi:', isAdmin);
        console.log('Test modu:', testMode);
        
        // Manuel olarak butonları göster
        document.querySelectorAll('.status-edit-btn').forEach(btn => {
            btn.style.display = 'flex';
            console.log('Buton gösterildi:', btn.id);
        });
        
        if (isAdmin || testMode) {
            // Admin ise düzenleme butonlarını göster
            document.querySelectorAll('.status-edit-btn').forEach(btn => {
                btn.style.display = 'flex';
            });
            console.log('Admin butonları gösterildi');
        } else {
            console.log('Admin değil, butonlar gizlendi');
        }
    }

    updateMotorStatus(motorId, status) {
        const statusElement = document.getElementById(`${motorId}-status`);
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `motor-status ${status === 'AKTİF' ? 'active' : 'inactive'}`;
        }
    }

    updateMotorCards(motorData) {
        // GM-1 kartını güncelle
        document.getElementById('gm1-hours').textContent = motorData.gm1.hours;
        document.getElementById('gm1-power').textContent = motorData.gm1.power;
        document.getElementById('gm1-hourly-avg').textContent = motorData.gm1.hourlyAvg;
        document.getElementById('gm1-daily-hours').textContent = motorData.gm1.dailyHours;
        document.getElementById('gm1-daily-production').textContent = motorData.gm1.dailyProduction;

        // GM-2 kartını güncelle
        document.getElementById('gm2-hours').textContent = motorData.gm2.hours;
        document.getElementById('gm2-power').textContent = motorData.gm2.power;
        document.getElementById('gm2-hourly-avg').textContent = motorData.gm2.hourlyAvg;
        document.getElementById('gm2-daily-hours').textContent = motorData.gm2.dailyHours;
        document.getElementById('gm2-daily-production').textContent = motorData.gm2.dailyProduction;

        // GM-3 kartını güncelle
        document.getElementById('gm3-hours').textContent = motorData.gm3.hours;
        document.getElementById('gm3-power').textContent = motorData.gm3.power;
        document.getElementById('gm3-hourly-avg').textContent = motorData.gm3.hourlyAvg;
        document.getElementById('gm3-daily-hours').textContent = motorData.gm3.dailyHours;
        document.getElementById('gm3-daily-production').textContent = motorData.gm3.dailyProduction;
    }

    updateSteamCards(steamData) {
        // Buhar üretim kartını güncelle
        document.getElementById('monthly-steam-production').textContent = steamData.monthlyTotal;
        document.getElementById('latest-steam-production').textContent = steamData.latestValue;
        document.getElementById('steam-update').textContent = steamData.updateTime;
    }

    async saveHourlyDataEntry() {
        console.log('🔄 saveHourlyDataEntry başlatıldı...');
        console.log('📍 Mevcut sayfa:', this.currentPage);
        
        const date = document.getElementById('hourly-date').value;
        
        if (!date) {
            this.showError('Lütfen tarih seçin');
            return false;
        }

        // Tüm saatlik verileri topla
        const hourlyData = [];
        const activePowerInputs = document.querySelectorAll('.active-power');
        const reactivePowerInputs = document.querySelectorAll('.reactive-power');

        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0');
            const activePower = parseFloat(activePowerInputs[i].value) || 0;
            const reactivePower = parseFloat(reactivePowerInputs[i].value) || 0;

            hourlyData.push({
                hour: hour,
                activePower: activePower,
                reactivePower: reactivePower
            });
        }

        // En az bir veri girilmiş mi kontrol et
        const hasData = hourlyData.some(data => data.activePower > 0 || data.reactivePower > 0);
        
        if (!hasData) {
            this.showError('Lütfen en az bir saat için veri girin');
            return false;
        }

        const formData = {
            date: date,
            hourlyData: hourlyData,
            timestamp: new Date().toISOString(),
            totalActivePower: hourlyData.reduce((sum, data) => sum + data.activePower, 0),
            totalReactivePower: hourlyData.reduce((sum, data) => sum + data.reactivePower, 0)
        };

        try {
            console.log('💾 Veri kaydediliyor...');
            
            // Google Sheets'e kaydet (API anahtarı geçerliyse)
            let sheetsSuccess = false;
            if (typeof googleSheets !== 'undefined' && googleSheets.saveHourlyData) {
                try {
                    await googleSheets.saveHourlyData(formData);
                    sheetsSuccess = true;
                    this.showSuccess(`${date} tarihine ait saatlik veriler Google Sheets'e başarıyla kaydedildi`);
                } catch (sheetsError) {
                    if (sheetsError.message === 'API_YAZMA_IZNI_YOK') {
                        console.warn('Google Sheets yazma izni yok, sadece LocalStorage kullanılıyor');
                        this.showSuccess(`${date} tarihine ait saatlik veriler LocalStorage\'a kaydedildi (Google Sheets yazma izni gerekli)`);
                    } else {
                        console.warn('Google Sheets kaydı başarısız, LocalStorage kullanılıyor:', sheetsError.message);
                        this.showSuccess(`${date} tarihine ait saatlik veriler başarıyla kaydedildi (LocalStorage)`);
                    }
                    sheetsSuccess = false;
                }
            }

            if (!sheetsSuccess) {
                this.showSuccess(`${date} tarihine ait saatlik veriler başarıyla kaydedildi (LocalStorage)`);
            }

            // LocalStorage'a her durumda kaydet (yedek olarak)
            const existingData = JSON.parse(localStorage.getItem('hourlyData') || '[]');
            existingData.push(formData);
            localStorage.setItem('hourlyData', JSON.stringify(existingData));
            
            console.log('✅ Veri kaydedildi, form temizleniyor...');
            
            // Formu temizle ve sonraki tarihi ayarla
            this.resetHourlyForm();
            await this.setNextAvailableDate();
            
            console.log('🔍 Sayfa değişimi kontrolü - Mevcut sayfa:', this.currentPage);
            
            // Dashboard'u SADECE overview'daysa güncelle
            if (this.currentPage === 'overview') {
                console.log('📊 Dashboard güncelleniyor...');
                this.loadDashboardData();
            } else {
                console.log('⚠️ Overview sayfasında değil, dashboard güncellenmiyor');
            }

            console.log('✅ saveHourlyDataEntry tamamlandı');
            return true; // Başarılı olduğunu belirt

        } catch (error) {
            console.error('❌ Saatlik veri kaydedilemedi:', error);
            this.showError('Saatlik veri kaydedilemedi');
            return false;
        }
    }

    async setNextAvailableDate() {
        try {
            // Google Sheets'ten sonraki uygun tarihi al (API anahtarı geçerliyse)
            if (typeof googleSheets !== 'undefined' && googleSheets.getNextAvailableDate) {
                try {
                    const nextDate = await googleSheets.getNextAvailableDate();
                    const dateInput = document.getElementById('hourly-date');
                    if (dateInput && nextDate) {
                        dateInput.value = nextDate;
                        console.log('Sonraki uygun tarih ayarlandı:', nextDate);
                    }
                } catch (sheetsError) {
                    console.warn('Google Sheets tarih kontrolü başarısız, bugün ayarlanıyor:', sheetsError.message);
                    // Hata durumunda bugünü ayarla
                    const dateInput = document.getElementById('hourly-date');
                    if (dateInput) {
                        dateInput.valueAsDate = new Date();
                    }
                }
            } else {
                // Google Sheets yoksa bugünü ayarla
                const dateInput = document.getElementById('hourly-date');
                if (dateInput) {
                    dateInput.valueAsDate = new Date();
                }
            }
        } catch (error) {
            console.error('Tarih ayarlanamadı:', error);
            // Son çare olarak bugünü ayarla
            const dateInput = document.getElementById('hourly-date');
            if (dateInput) {
                dateInput.valueAsDate = new Date();
            }
        }
    }

    resetHourlyForm() {
        const activePowerInputs = document.querySelectorAll('.active-power');
        const reactivePowerInputs = document.querySelectorAll('.reactive-power');
        
        activePowerInputs.forEach(input => input.value = '');
        reactivePowerInputs.forEach(input => input.value = '');
        
        // Sonraki uygun tarihi ayarla
        this.setNextAvailableDate();
    }

    async saveDataEntry() {
        const formData = {
            date: document.getElementById('date').value,
            production: parseFloat(document.getElementById('production').value),
            fuel: parseFloat(document.getElementById('fuel').value),
            hours: parseFloat(document.getElementById('hours').value),
            timestamp: new Date().toISOString()
        };

        try {
            this.showSuccess('Veri başarıyla kaydedildi');
            document.getElementById('data-form').reset();
            
            if (this.currentPage === 'overview') {
                this.loadDashboardData();
            }
        } catch (error) {
            console.error('Veri kaydedilemedi:', error);
            this.showError('Veri kaydedilemedi');
        }
    }

    loadDataEntryForm() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }

        // Saatlik form için sonraki uygun tarihi ayarla
        this.setNextAvailableDate();
        
        // LocalStorage'daki verileri göster
        this.showLocalStorageData();
        
        // Google Sheets API testini çalıştır
        this.testGoogleSheetsAPI();
    }

    async testGoogleSheetsAPI() {
        if (typeof googleSheets !== 'undefined') {
            console.log('=== Google Sheets API Testi Başlatılıyor ===');
            try {
                const testResult = await googleSheets.testApiPermissions();
                if (testResult.success) {
                    console.log('✅ Google Sheets API çalışıyor');
                    console.log('Spreadsheet sayfaları:', testResult.data.sheets?.map(s => s.properties.title));
                    
                    // Saatlik_Enerji_Detay sayfası var mı kontrol et
                    const hasHourlyPage = testResult.data.sheets?.some(s => 
                        s.properties.title === 'Saatlik_Enerji_Detay'
                    );
                    
                    if (!hasHourlyPage) {
                        console.warn('⚠️ "Saatlik_Enerji_Detay" sayfası bulunamadı!');
                        console.log('Mevcut sayfalar:', testResult.data.sheets?.map(s => s.properties.title));
                    } else {
                        console.log('✅ "Saatlik_Enerji_Detay" sayfası bulundu');
                    }
                } else {
                    console.error('❌ Google Sheets API hatası:', testResult.error);
                }
            } catch (error) {
                console.error('❌ API testi başarısız:', error);
            }
            console.log('=== API Testi Bitti ===');
        }
    }

    showLocalStorageData() {
        const storedData = JSON.parse(localStorage.getItem('hourlyData') || '[]');
        
        if (storedData.length > 0) {
            console.log('LocalStorage\'da kayıtlı veriler:', storedData);
            
            // En son 5 kaydı göster
            const recentData = storedData.slice(-5).reverse();
            let dataInfo = `LocalStorage'da ${storedData.length} kayıt var.\n\nSon kayıtlar:\n`;
            
            recentData.forEach((data, index) => {
                dataInfo += `${index + 1}. ${data.date} - ${data.totalActivePower.toFixed(2)} MWh\n`;
            });
            
            console.log(dataInfo);
            
            // Başarı mesajına bilgi ekle
            setTimeout(() => {
                const alertContainer = document.getElementById('alert-container');
                if (alertContainer && alertContainer.lastElementChild) {
                    const alert = alertContainer.lastElementChild;
                    const infoDiv = document.createElement('div');
                    infoDiv.style.cssText = 'font-size: 11px; margin-top: 8px; opacity: 0.8;';
                    infoDiv.textContent = `LocalStorage: ${storedData.length} kayıt (Console'da detaylar)`;
                    alert.appendChild(infoDiv);
                }
            }, 100);
        } else {
            console.log('LocalStorage\'ta kayıtlı veri bulunamadı');
        }
    }

    async loadReports() {
        try {
            const reportData = {
                totalProduction: Math.floor(Math.random() * 10000) + 5000,
                avgEfficiency: Math.floor(Math.random() * 20) + 75,
                totalHours: Math.floor(Math.random() * 100) + 50
            };
            this.displayReports(reportData);
        } catch (error) {
            console.error('Raporlar yüklenemedi:', error);
            this.showError('Raporlar yüklenemedi');
        }
    }

    displayReports(data) {
        const reportContent = document.getElementById('report-content');
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="report-summary" style="background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: 16px; padding: 24px; margin-top: 20px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 16px;">📊 Rapor Özeti</h3>
                    <div style="display: grid; gap: 12px;">
                        <p style="color: var(--text-secondary); margin: 0;"><strong>Toplam Üretim:</strong> ${data.totalProduction.toLocaleString()} kWh</p>
                        <p style="color: var(--text-secondary); margin: 0;"><strong>Ortalama Verimlilik:</strong> %${data.avgEfficiency}</p>
                        <p style="color: var(--text-secondary); margin: 0;"><strong>Toplam Çalışma Saati:</strong> ${data.totalHours} saat</p>
                    </div>
                </div>
            `;
        }
    }

    async loadUsers() {
        try {
            const mockUsers = [
                { name: 'Admin User', email: 'admin@kojen.com', role: 'Yönetici', active: true },
                { name: 'Operator User', email: 'operator@kojen.com', role: 'Operatör', active: true },
                { name: 'View User', email: 'viewer@kojen.com', role: 'İzleyici', active: false }
            ];
            this.displayUsers(mockUsers);
        } catch (error) {
            console.error('Kullanıcılar yüklenemedi:', error);
            this.showError('Kullanıcılar yüklenemedi');
        }
    }

    displayUsers(users) {
        const userList = document.getElementById('user-list');
        if (userList) {
            userList.innerHTML = users.map(user => `
                <div class="user-card" style="background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: 16px; padding: 20px; margin-bottom: 16px;">
                    <h4 style="color: var(--text-primary); margin: 0 0 8px 0;">${user.name}</h4>
                    <p style="color: var(--text-secondary); margin: 4px 0; font-size: 14px;">📧 ${user.email}</p>
                    <p style="color: var(--text-secondary); margin: 4px 0; font-size: 14px;">👤 ${user.role}</p>
                    <p style="color: ${user.active ? 'var(--accent-success)' : 'var(--text-muted)'}; margin: 4px 0; font-size: 14px; font-weight: 600;">● ${user.active ? 'Aktif' : 'Pasif'}</p>
                </div>
            `).join('');
        }
    }

    checkAuthentication() {
        const token = localStorage.getItem('authToken');
        const storedUserDataRaw = localStorage.getItem('userData');
        const storedUserData = storedUserDataRaw ? JSON.parse(storedUserDataRaw) : null;

        // Sadece token var diye otomatik giriş yapma.
        // Kullanıcı verisi yoksa/bozuksa login ekranına dön.
        if (token && storedUserData && storedUserData.email) {
            this.isAuthenticated = true;
            this.userData = storedUserData;
            this.updateUserInfo();
            this.showDashboard();
            return;
        }

        // Geçersiz oturumu temizle
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        this.isAuthenticated = false;
        this.userData = null;
        this.showLogin();
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('user-name');
        const userRoleElement = document.getElementById('user-role');
        const userAvatarElement = document.getElementById('user-avatar');
        
        if (this.userData) {
            if (userNameElement) userNameElement.textContent = this.userData.name;
            if (userRoleElement) userRoleElement.textContent = this.userData.role;
            if (userAvatarElement) userAvatarElement.textContent = this.userData.name.charAt(0).toUpperCase();
        }
    }

    showLogin() {
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        this.loadDashboardData();
        this.checkAdminStatus(); // Admin kontrolünü buraya ekledim
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            if (email && password) {
                console.log('Giriş denemesi:', email);
                
                // Google Sheets'ten kullanıcı doğrula
                const user = await googleSheets.validateUser(email, password);
                
                if (user) {
                    console.log('Giriş başarılı:', user);
                    this.isAuthenticated = true;
                    this.userData = user;
                    localStorage.setItem('authToken', 'token-' + Date.now());
                    localStorage.setItem('userData', JSON.stringify(user));
                    
                    this.showDashboard();
                    this.updateUserInfo();
                    this.showSuccess('Giriş başarılı');
                    this.checkAdminStatus(); // Giriş sonrası admin kontrolü
                } else {
                    console.log('Giriş başarısız: Kullanıcı bulunamadı veya şifre hatalı');
                    // Güvenlik: başarısız girişte state'i ve localStorage'ı temizle
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    this.isAuthenticated = false;
                    this.userData = null;
                    this.showError('Email veya şifre hatalı');
                }
            } else {
                this.showError('Lütfen email ve şifre girin');
            }
        } catch (error) {
            console.error('Giriş hatası:', error);
            // Güvenlik: hata durumunda state'i ve localStorage'ı temizle
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            this.isAuthenticated = false;
            this.userData = null;
            this.showError('Giriş yapılamadı. Lütfen bağlantınızı kontrol edin.');
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'error');
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;

        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.innerHTML = `
            <div class="alert-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</div>
            <div>${message}</div>
        `;
        
        alertContainer.appendChild(alert);

        setTimeout(() => alert.classList.add('show'), 100);
        
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 500);
        }, 3000);
    }
}

// Global fonksiyonlar
function toggleMotorStatus(motorId) {
    console.log('Durum değiştirme:', motorId);
    
    // Kullanıcının admin olup olmadığını kontrol et
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const isAdmin = userData.role === 'ADMIN' || userData.role === 'admin';
    
    console.log('Kullanıcı rolü:', userData.role);
    console.log('Admin mi:', isAdmin);
    
    if (!isAdmin) {
        app.showError('Bu işlemi yapmaya yetkiniz yok! Sadece adminler değiştirebilir.');
        return;
    }
    
    const statusElement = document.getElementById(`${motorId}-status`);
    if (!statusElement) {
        console.error('Status element bulunamadı:', motorId);
        return;
    }
    
    const currentStatus = statusElement.textContent.trim();
    const newStatus = currentStatus === 'AKTİF' ? 'PASİF' : 'AKTİF';
    
    statusElement.textContent = newStatus;
    statusElement.className = `motor-status clickable ${newStatus === 'AKTİF' ? 'active' : 'inactive'}`;
    
    console.log(`${motorId} durumu: ${newStatus}`);
    
    // Başarı mesajı
    app.showSuccess(`${motorId.toUpperCase()} durumu "${newStatus}" olarak güncellendi`);
}

function showSection(sectionName) {
    app.showSection(sectionName);
}

function generateReport() {
    app.loadReports();
}

function addUser() {
    app.showAlert('Kullanıcı ekleme özelliği yakında eklenecek', 'info');
}

function saveSettings() {
    app.showSuccess('Ayarlar kaydedildi');
}

function resetForm() {
    document.getElementById('data-form').reset();
    app.loadDataEntryForm();
}

function resetHourlyForm() {
    app.resetHourlyForm();
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    location.reload();
}

// Uygulamayı başlat
const app = new KojenerasyonApp();

// Sayfa yüklendiğinde admin kontrolünü çalıştır
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('Sayfa yüklendi, admin kontrolü başlatılıyor...');
        app.checkAdminStatus();
    }, 1000);
});
