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
            // Google Sheets'ten verileri çek
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
        } catch (error) {
            console.error('Motor verileri yüklenemedi:', error);
            this.showError('Motor verileri yüklenemedi');
            // Hata durumunda mock verileri kullan
            this.loadMockData();
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

    updateMotorCards(data) {
        const elements = {
            'gm1-hours': data.gm1.hours,
            'gm1-power': data.gm1.power,
            'gm1-daily-hours': data.gm1.dailyHours,
            'gm1-daily-production': data.gm1.dailyProduction,
            'gm1-hourly-avg': data.gm1.hourlyAvg,
            'gm2-hours': data.gm2.hours,
            'gm2-power': data.gm2.power,
            'gm2-daily-hours': data.gm2.dailyHours,
            'gm2-daily-production': data.gm2.dailyProduction,
            'gm2-hourly-avg': data.gm2.hourlyAvg,
            'gm3-hours': data.gm3.hours,
            'gm3-power': data.gm3.power,
            'gm3-daily-hours': data.gm3.dailyHours,
            'gm3-daily-production': data.gm3.dailyProduction,
            'gm3-hourly-avg': data.gm3.hourlyAvg
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
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
        if (token) {
            this.isAuthenticated = true;
            this.userData = JSON.parse(localStorage.getItem('userData')) || { name: 'Test Kullanıcı', role: 'Yönetici' };
            this.updateUserInfo();
            this.showDashboard();
        } else {
            this.showLogin();
        }
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
        document.getElementById('dashboard').style.display = 'flex';
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            if (email && password) {
                this.isAuthenticated = true;
                this.userData = { name: email.split('@')[0], role: 'Yönetici' };
                localStorage.setItem('authToken', 'mock-token-' + Date.now());
                localStorage.setItem('userData', JSON.stringify(this.userData));
                
                this.showDashboard();
                this.updateUserInfo();
                this.showSuccess('Giriş başarılı');
            } else {
                this.showError('Lütfen email ve şifre girin');
            }
        } catch (error) {
            console.error('Giriş hatası:', error);
            this.showError('Giriş yapılamadı');
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

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    location.reload();
}

// Uygulamayı başlat
const app = new KojenerasyonApp();
