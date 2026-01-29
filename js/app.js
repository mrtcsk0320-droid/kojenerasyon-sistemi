// Ana Uygulama Mantığı
class KojenerasyonApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.userData = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Sayfa yüklendiğinde çalışacak kodlar
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.checkAuthentication();
            this.loadDashboardData();
        });
    }

    setupEventListeners() {
        // Form submit olayı
        const dataForm = document.getElementById('data-form');
        if (dataForm) {
            dataForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDataEntry();
            });
        }

        // Sayfa geçiş butonları
        const navButtons = document.querySelectorAll('nav button');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const pageName = e.target.textContent.toLowerCase()
                    .replace(' kontrol paneli', 'dashboard')
                    .replace(' veri girişi', 'data-entry')
                    .replace(' raporlar', 'reports')
                    .replace(' kullanıcılar', 'users');
                this.showPage(pageName);
            });
        });
    }

    showPage(pageName) {
        // Tüm sayfaları gizle
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));

        // Seçili sayfayı göster
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;

            // Nav butonlarını güncelle
            this.updateNavButtons(pageName);

            // Sayfa özel verileri yükle
            this.loadPageData(pageName);
        }
    }

    updateNavButtons(activePage) {
        const navButtons = document.querySelectorAll('nav button');
        navButtons.forEach(button => {
            button.classList.remove('active');
            const buttonText = button.textContent.toLowerCase();
            
            if ((activePage === 'dashboard' && buttonText.includes('kontrol')) ||
                (activePage === 'data-entry' && buttonText.includes('veri')) ||
                (activePage === 'reports' && buttonText.includes('rapor')) ||
                (activePage === 'users' && buttonText.includes('kullanıcı'))) {
                button.classList.add('active');
            }
        });
    }

    loadPageData(pageName) {
        switch(pageName) {
            case 'dashboard':
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
            const data = await googleSheets.getDashboardData();
            
            // Dashboard kartlarını güncelle
            this.updateDashboardCards(data);
        } catch (error) {
            console.error('Dashboard verileri yüklenemedi:', error);
            this.showError('Dashboard verileri yüklenemedi');
        }
    }

    updateDashboardCards(data) {
        const dailyProduction = document.getElementById('daily-production');
        const efficiency = document.getElementById('efficiency');
        const activeUsers = document.getElementById('active-users');

        if (dailyProduction) {
            dailyProduction.textContent = data.dailyProduction ? `${data.dailyProduction} kWh` : '-';
        }
        
        if (efficiency) {
            efficiency.textContent = data.efficiency ? `%${data.efficiency}` : '-';
        }
        
        if (activeUsers) {
            activeUsers.textContent = data.activeUsers ? data.activeUsers : '-';
        }
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
            await googleSheets.saveDataEntry(formData);
            this.showSuccess('Veri başarıyla kaydedildi');
            document.getElementById('data-form').reset();
            
            // Dashboard'u güncelle
            if (this.currentPage === 'dashboard') {
                this.loadDashboardData();
            }
        } catch (error) {
            console.error('Veri kaydedilemedi:', error);
            this.showError('Veri kaydedilemedi');
        }
    }

    loadDataEntryForm() {
        // Bugünün tarihini varsayılan olarak ayarla
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
    }

    async loadReports() {
        // Rapor verilerini yükle
        try {
            const reportData = await googleSheets.getReportData();
            this.displayReports(reportData);
        } catch (error) {
            console.error('Raporlar yüklenemedi:', error);
            this.showError('Raporlar yüklenemedi');
        }
    }

    displayReports(data) {
        const reportContent = document.getElementById('report-content');
        if (reportContent) {
            // Basit rapor gösterimi
            reportContent.innerHTML = `
                <div class="report-summary">
                    <h3>Özet</h3>
                    <p>Toplam Üretim: ${data.totalProduction || 0} kWh</p>
                    <p>Ortalama Verimlilik: ${data.avgEfficiency || 0}%</p>
                    <p>Toplam Çalışma Saati: ${data.totalHours || 0} saat</p>
                </div>
            `;
        }
    }

    async loadUsers() {
        try {
            const users = await googleSheets.getUsers();
            this.displayUsers(users);
        } catch (error) {
            console.error('Kullanıcılar yüklenemedi:', error);
            this.showError('Kullanıcılar yüklenemedi');
        }
    }

    displayUsers(users) {
        const userList = document.getElementById('user-list');
        if (userList) {
            userList.innerHTML = users.map(user => `
                <div class="user-card">
                    <h4>${user.name}</h4>
                    <p>Email: ${user.email}</p>
                    <p>Rol: ${user.role}</p>
                    <p>Durum: ${user.active ? 'Aktif' : 'Pasif'}</p>
                </div>
            `).join('');
        }
    }

    checkAuthentication() {
        // Basit kimlik doğrulama kontrolü
        const token = localStorage.getItem('authToken');
        if (token) {
            this.isAuthenticated = true;
            this.userData = JSON.parse(localStorage.getItem('userData'));
            this.updateUserInfo();
        } else {
            // Giriş sayfasına yönlendir veya giriş modalını göster
            this.showLoginModal();
        }
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && this.userData) {
            userNameElement.textContent = `${this.userData.name} (${this.userData.role})`;
        }
    }

    showLoginModal() {
        // Giriş modalı göster
        const modal = document.createElement('div');
        modal.className = 'login-modal';
        modal.innerHTML = `
            <div class="login-container">
                <div class="login-header">
                    <h1>Kojenerasyon Takip Sistemi</h1>
                    <p class="login-subtitle">Lütfen giriş yapınız</p>
                </div>
                <form id="login-form" class="login-form">
                    <div class="input-group">
                        <div class="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </div>
                        <input type="email" id="login-email" placeholder="Email adresiniz" required>
                    </div>
                    <div class="input-group">
                        <div class="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0110 0v4"></path>
                            </svg>
                        </div>
                        <input type="password" id="login-password" placeholder="Şifreniz" required>
                    </div>
                    <button type="submit" class="login-btn">
                        <span>Giriş Yap</span>
                        <div class="login-spinner"></div>
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Login form olayı
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const loginBtn = document.querySelector('.login-btn');
        const spinner = document.querySelector('.login-spinner');
        
        // Loading durumunu göster
        loginBtn.classList.add('loading');
        spinner.style.display = 'block';

        try {
            const result = await auth.login(email, password);
            if (result.success) {
                this.isAuthenticated = true;
                this.userData = result.user;
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));
                
                // Modalı kaldır
                document.querySelector('.login-modal').remove();
                this.updateUserInfo();
                this.showSuccess('Giriş başarılı');
            } else {
                this.showError(result.message || 'Giriş başarısız');
            }
        } catch (error) {
            console.error('Giriş hatası:', error);
            this.showError(error?.message || 'Giriş yapılamadı');
        } finally {
            // Loading durumunu gizle
            loginBtn.classList.remove('loading');
            spinner.style.display = 'none';
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'error');
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.textContent = message;
        
        // Sayfanın üstüne ekle
        const main = document.querySelector('main');
        main.insertBefore(alert, main.firstChild);

        // 3 saniye sonra kaldır
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }
}

// Global fonksiyonlar
function showPage(pageName) {
    app.showPage(pageName);
}

function generateReport() {
    const period = document.getElementById('report-period').value;
    app.loadReports();
}

function addUser() {
    // Yeni kullanıcı ekleme modalı
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Yeni Kullanıcı Ekle</h2>
            <form id="add-user-form">
                <div class="form-group">
                    <label>Ad Soyad:</label>
                    <input type="text" id="user-name" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="user-email" required>
                </div>
                <div class="form-group">
                    <label>Şifre:</label>
                    <input type="password" id="user-password" required>
                </div>
                <div class="form-group">
                    <label>Rol:</label>
                    <select id="user-role">
                        <option value="user">Kullanıcı</option>
                        <option value="admin">Yönetici</option>
                    </select>
                </div>
                <button type="submit">Ekle</button>
                <button type="button" onclick="this.closest('.modal').remove()">İptal</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('add-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await app.handleAddUser();
    });
}

// Uygulamayı başlat
const app = new KojenerasyonApp();
