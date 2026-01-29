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
        } else {
            // Giriş sayfasına yönlendir veya giriş modalını göster
            this.showLoginModal();
        }
    }

    showLoginModal() {
        // Giriş modalı göster
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Giriş Yap</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="login-email" required>
                    </div>
                    <div class="form-group">
                        <label>Şifre:</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <button type="submit">Giriş Yap</button>
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

        try {
            const result = await auth.login(email, password);
            if (result.success) {
                this.isAuthenticated = true;
                this.userData = result.user;
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));
                
                // Modalı kaldır
                document.querySelector('.modal').remove();
                this.showSuccess('Giriş başarılı');
            } else {
                this.showError(result.message || 'Giriş başarısız');
            }
        } catch (error) {
            console.error('Giriş hatası:', error);
            this.showError(error?.message || 'Giriş yapılamadı');
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
