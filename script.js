// Application State
const AppState = {
    currentUser: null,
    isAuthenticated: false,
    theme: localStorage.getItem('theme') || 'light',
    currentPage: 'dashboard',
    sidebarCollapsed: false,
    googleSheetsData: {
        production: [],
        efficiency: [],
        maintenance: []
    }
};

// Google Sheets Configuration - Demo mode for GitHub Pages
const API_BASE_URL = 'https://jsonplaceholder.typicode.com'; // Demo API

// Demo API functions for GitHub Pages
async function demoAPICall(endpoint, method = 'GET', data = null) {
    // Simulate API calls for demo
    return new Promise((resolve) => {
        setTimeout(() => {
            if (endpoint.includes('auth/login')) {
                const users = [
                    { email: 'admin@kojenerasyon.com', password: 'admin123', name: 'Admin User', role: 'Admin' },
                    { email: 'operator@kojenerasyon.com', password: 'operator123', name: 'Operator', role: 'Operator' },
                    { email: 'viewer@kojenerasyon.com', password: 'viewer123', name: 'Viewer', role: 'Viewer' }
                ];
                
                const user = users.find(u => u.email === data.email && u.password === data.password);
                
                if (user) {
                    resolve({ 
                        success: true, 
                        user: { id: 1, email: user.email, name: user.name, role: user.role },
                        token: 'demo-token-' + Date.now()
                    });
                } else {
                    resolve({ success: false, message: 'E-posta veya şifre hatalı' });
                }
            } else if (endpoint.includes('production')) {
                resolve({
                    success: true,
                    data: {
                        dailyProduction: 360,
                        currentPower: 104,
                        efficiency: 84,
                        uptime: 20,
                        motors: [
                            { id: 'GM-1', status: true, totalHours: 0, totalProduction: 0, dailyHours: 0, dailyProduction: 0, avgProduction: 0 },
                            { id: 'GM-2', status: true, totalHours: 0, totalProduction: 0, dailyHours: 0, dailyProduction: 0, avgProduction: 0 },
                            { id: 'GM-3', status: true, totalHours: 0, totalProduction: 0, dailyHours: 0, dailyProduction: 0, avgProduction: 0 }
                        ]
                    }
                });
            } else if (endpoint.includes('energy/hourly')) {
                resolve({
                    success: true,
                    message: `${data.sheetName} sayfasına ${data.data.length} saatlik veri başarıyla kaydedildi (Demo mod)`,
                    savedCount: data.data.length
                });
            } else {
                resolve({ success: true, message: 'Demo mod - çalışıyor' });
            }
        }, 500); // Simulate network delay
    });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeEventListeners();
    checkAuthentication();
});

// Theme Management
function initializeTheme() {
    const theme = AppState.theme;
    document.body.setAttribute('data-theme', theme);
    
    // Update theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = theme === 'dark' ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }
}

function toggleTheme() {
    const currentTheme = AppState.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    AppState.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    
    // Update theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = newTheme === 'dark' ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }
    
    showNotification(`${newTheme === 'dark' ? 'Koyu' : 'Açık'} temaya geçildi`, 'success');
}

// Event Listeners
function initializeEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Navigation
    initializeNavigation();
    
    // Forms
    initializeForms();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page) {
                showPage(page);
            }
        });
    });
}

function showPage(page) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.style.display = 'none');
    
    // Show selected page
    const selectedPage = document.getElementById(page + 'Page');
    if (selectedPage) {
        selectedPage.style.display = 'block';
        AppState.currentPage = page;
        
        // Update navigation active state
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });
        
        // Page-specific initialization
        if (page === 'dashboard') {
            loadDashboardData();
        }
    }
}

// Authentication
function checkAuthentication() {
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    
    if (savedUser && token) {
        AppState.currentUser = JSON.parse(savedUser);
        AppState.isAuthenticated = true;
        showDashboard();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    showPage('login');
}

function showDashboard() {
    showPage('dashboard');
    
    // Update user info
    if (AppState.currentUser) {
        document.getElementById('userName').textContent = AppState.currentUser.name;
        document.getElementById('userRole').textContent = AppState.currentUser.role;
    }
    
    // Load dashboard data
    loadDashboardData();
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    
    // Show processing state
    loginBtn.classList.add('processing');
    loginBtn.querySelector('.btn-text').textContent = 'Doğrulanıyor...';
    errorDiv.style.display = 'none';
    
    try {
        // Use demo API
        const response = await demoAPICall('auth/login', 'POST', { email, password });
        
        if (response.success) {
            // Show success state
            loginBtn.classList.remove('processing');
            loginBtn.classList.add('success');
            loginBtn.querySelector('.btn-text').textContent = 'Başarılı!';
            
            AppState.currentUser = response.user;
            AppState.isAuthenticated = true;
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('authToken', response.token);
            
            // Handle remember me
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // Show success message
            showNotification('Hoş geldiniz!');
            
            // Redirect to dashboard
            setTimeout(() => {
                showDashboard();
            }, 800);
        } else {
            // Show error
            loginBtn.classList.remove('processing');
            loginBtn.querySelector('.btn-text').textContent = 'Giriş Yap';
            
            errorDiv.textContent = response.message;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        loginBtn.classList.remove('processing');
        loginBtn.querySelector('.btn-text').textContent = 'Giriş Yap';
        
        errorDiv.textContent = 'Bağlantı hatası';
        errorDiv.style.display = 'block';
    }
}

function logout() {
    AppState.currentUser = null;
    AppState.isAuthenticated = false;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    showLoginScreen();
    showNotification('Çıkış yapıldı', 'info');
}

// Dashboard Data Management
async function loadDashboardData() {
    try {
        // Use demo API for production data
        const response = await demoAPICall('production');
        if (response.success) {
            AppState.googleSheetsData.production = response.data;
        }
        
        updateStatsCards();
        updateMotorCards();
        updateProductionChart();
        updateEfficiencyChart();
    } catch (error) {
        console.error('Dashboard data loading error:', error);
        // Use mock data on error
        updateStatsCards();
        updateMotorCards();
        updateProductionChart();
        updateEfficiencyChart();
    }
}

function updateStatsCards() {
    const data = AppState.googleSheetsData.production;
    
    // Update stats cards with animation
    const statsCards = [
        { id: 'dailyProduction', value: data.dailyProduction || 0, unit: 'kWh' },
        { id: 'currentPower', value: data.currentPower || 0, unit: 'kW' },
        { id: 'efficiency', value: data.efficiency || 0, unit: '%' },
        { id: 'uptime', value: data.uptime || 0, unit: 'saat' }
    ];
    
    statsCards.forEach(card => {
        const element = document.getElementById(card.id);
        if (element) {
            const valueElement = element.querySelector('.stat-value');
            const unitElement = element.querySelector('.stat-unit');
            
            if (valueElement) {
                animateValue(valueElement, 0, card.value, 1000);
            }
            if (unitElement) {
                unitElement.textContent = card.unit;
            }
        }
    });
}

function updateMotorCards() {
    const data = AppState.googleSheetsData.production;
    
    if (data.motors) {
        data.motors.forEach(motor => {
            const motorCard = document.getElementById(`motor-${motor.id}`);
            if (motorCard) {
                const statusIndicator = motorCard.querySelector('.status-indicator');
                const statusText = motorCard.querySelector('.status-text');
                
                if (statusIndicator) {
                    statusIndicator.className = `status-indicator ${motor.status ? 'online' : 'offline'}`;
                }
                if (statusText) {
                    statusText.textContent = motor.status ? 'Çalışıyor' : 'Durmuş';
                }
            }
        });
    }
}

// Energy Data Management
function saveHourlyData() {
    const date = document.getElementById('hourlyDate').value;
    
    if (!date) {
        showNotification('Tarih seçin', 'error');
        return;
    }
    
    // Vardiya seçimini atla, varsayılan olarak 1 kullan
    const vardiya = '1';
    
    const hourlyData = [];
    const rows = document.querySelectorAll('.hourly-row');
    let emptyInputs = [];
    
    rows.forEach((row, index) => {
        const time = row.querySelector('.hourly-time').textContent;
        const aktifInput = row.querySelector('.hourly-aktif');
        const reaktifInput = row.querySelector('.hourly-reaktif');
        
        // Boş inputları kontrol et
        if (!aktifInput.value && !reaktifInput.value) {
            emptyInputs.push(time);
        } else {
            hourlyData.push({
                date: date,
                time: time,
                vardiya: vardiya,
                aktif: parseFloat(aktifInput.value) || 0,
                reaktif: parseFloat(reaktifInput.value) || 0,
                aydemAktif: 0, // Manuel girilecek
                aydemReaktif: 0 // Manuel girilecek
            });
        }
    });
    
    // Boş input varsa sor
    if (emptyInputs.length > 0) {
        const confirmEmpty = confirm(`${emptyInputs.join(', ')} saatlerinde veri girilmemiş. Yine de kaydetmek istiyor musunuz?`);
        if (!confirmEmpty) {
            return;
        }
    }
    
    if (hourlyData.length === 0) {
        showNotification('En az bir saatlik veri girin', 'error');
        return;
    }
    
    // Google Sheets'e kaydet
    saveHourlyDataToSheets(hourlyData, vardiya);
}

async function saveHourlyDataToSheets(hourlyData, vardiya) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showNotification('Önce giriş yapın', 'error');
            return;
        }
        
        // Tarihten ay ve yılı al
        const date = new Date(hourlyData[0].date);
        const monthNames = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 
                           'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
        const monthName = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const sheetName = `${monthName} ${year}`;
        
        // Use demo API
        const response = await demoAPICall('energy/hourly', 'POST', {
            sheetName: sheetName,
            vardiya: vardiya,
            data: hourlyData
        });
        
        if (response.success) {
            showNotification(response.message, 'success');
            
            // Input'ları temizle
            document.querySelectorAll('.hourly-inputs input').forEach(input => {
                input.value = '';
            });
        } else {
            showNotification('Kayıt sırasında hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Google Sheets bağlantı hatası:', error);
        showNotification('Bağlantı hatası', 'error');
    }
}

// Utility Functions
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end.toFixed(1);
            clearInterval(timer);
        } else {
            element.textContent = current.toFixed(1);
        }
    }, 16);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function toggleSidebar() {
    AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K for quick search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Implement quick search
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        // Close any open modals
    }
}

function initializeForms() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Energy form
    const saveHourlyBtn = document.getElementById('saveHourlyData');
    if (saveHourlyBtn) {
        saveHourlyBtn.addEventListener('click', saveHourlyData);
    }
}

// Chart initialization (placeholder)
function updateProductionChart() {
    // Implementation for production chart
}

function updateEfficiencyChart() {
    // Implementation for efficiency chart
}

// Export functions for global access
window.AppState = AppState;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.saveHourlyData = saveHourlyData;
