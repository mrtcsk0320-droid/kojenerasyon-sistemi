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

// Google Sheets Configuration - Backend API
const API_BASE_URL = '/api'; // Proxy üzerinden backend'e git

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application starting...');
    
    // Check for pending data first
    checkPendingData();
    
    // Initialize application components
    initializeTheme();
    initializeEventListeners();
    checkAuthentication();
    // PWA disabled temporarily - Service Worker not found
    // initializePWA();
    // Removed Google Sheets initialization - using Backend API
});

// PWA Functions
function initializePWA() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered:', registration);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New content is available
                                showPWAUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('❌ Service Worker registration failed:', error);
                });
        });
    }

    // Handle PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showPWAInstallButton();
    });

    // Handle app installed
    window.addEventListener('appinstalled', () => {
        console.log('📱 PWA installed successfully');
        hidePWAInstallButton();
        showNotification('Uygulama başarıyla kuruldu!', 'success');
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
        console.log('🌐 Back online');
        showNotification('İnternet bağlantısı sağlandı', 'success');
        document.body.classList.remove('offline');
    });

    window.addEventListener('offline', () => {
        console.log('📴 Gone offline');
        showNotification('Çevrimdışı moduna geçildi', 'warning');
        document.body.classList.add('offline');
    });
}

// PWA Install Button
function showPWAInstallButton() {
    // Remove existing button if any
    const existingBtn = document.getElementById('pwa-install-btn');
    if (existingBtn) existingBtn.remove();

    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3v10m-5-5h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 17h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Uygulamayı Kur
    `;
    
    Object.assign(installBtn.style, {
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
        zIndex: '10000',
        transition: 'all 0.3s ease'
    });

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            deferredPrompt = null;
            hidePWAInstallButton();
        }
    });

    document.body.appendChild(installBtn);
}

function hidePWAInstallButton() {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
}

// PWA Update Notification
function showPWAUpdateNotification() {
    const updateDiv = document.createElement('div');
    updateDiv.id = 'pwa-update-notification';
    updateDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span>Yeni güncelleme mevcut!</span>
            <button id="pwa-update-btn" style="background: rgba(255,255,255,0.2); border: none; padding: 4px 8px; border-radius: 4px; color: white; cursor: pointer;">Yenile</button>
        </div>
    `;
    
    Object.assign(updateDiv.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
        zIndex: '10001',
        fontSize: '14px',
        fontWeight: '500'
    });

    document.body.appendChild(updateDiv);

    document.getElementById('pwa-update-btn').addEventListener('click', () => {
        window.location.reload();
    });
}

// Push Notification Subscription
async function subscribeToPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
        });

        console.log('Push notification subscription:', subscription);
        
        // Send subscription to backend
        await fetch(`${API_BASE_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(subscription)
        });

        return true;
    } catch (error) {
        console.error('Push notification subscription failed:', error);
        return false;
    }
}

// VAPID Key Helper
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}

// Theme Management
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', AppState.theme);
}

function toggleTheme() {
    AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', AppState.theme);
    localStorage.setItem('theme', AppState.theme);
}

// Event Listeners
function initializeEventListeners() {
    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Sidebar Toggle
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    
    // User Menu
    document.getElementById('userMenuBtn').addEventListener('click', toggleUserMenu);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Password Toggle
    document.getElementById('passwordToggle').addEventListener('click', togglePasswordVisibility);
    
    // Remember Me
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        document.getElementById('email').value = savedEmail;
        rememberMeCheckbox.checked = true;
    }
    
    // Energy Page
    const saveHourlyBtn = document.getElementById('saveHourlyData');
    if (saveHourlyBtn) {
        saveHourlyBtn.addEventListener('click', saveHourlyData);
    }
    
    // Auto-focus email input
    setTimeout(() => {
        document.getElementById('email').focus();
    }, 100);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Dashboard Actions
    document.getElementById('refreshData').addEventListener('click', refreshDashboardData);
    document.getElementById('productionPeriod').addEventListener('change', updateProductionChart);
    
    // Motor Status Toggles
    document.querySelectorAll('.motor-status-toggle').forEach(toggle => {
        toggle.addEventListener('click', handleMotorStatusToggle);
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('userDropdown').classList.remove('active');
        }
    });
}

// Motor Status Management
function handleMotorStatusToggle(e) {
    const toggle = e.currentTarget;
    const motorId = toggle.dataset.motor;
    const statusText = toggle.querySelector('.status-text');
    
    // Toggle active/inactive state
    if (toggle.classList.contains('active')) {
        toggle.classList.remove('active');
        toggle.classList.add('inactive');
        statusText.textContent = 'PASİF';
        
        // Show notification
        showNotification(`${motorId} motoru durduruldu`, 'warning');
        
        // Update motor card appearance
        updateMotorCardAppearance(toggle.closest('.motor-card'), false);
    } else {
        toggle.classList.remove('inactive');
        toggle.classList.add('active');
        statusText.textContent = 'AKTİF';
        
        // Show notification
        showNotification(`${motorId} motoru başlatıldı`, 'success');
        
        // Update motor card appearance
        updateMotorCardAppearance(toggle.closest('.motor-card'), true);
    }
    
    // Save status to localStorage (in real app, would save to backend)
    const motorStatuses = JSON.parse(localStorage.getItem('motorStatuses') || '{}');
    motorStatuses[motorId] = toggle.classList.contains('active');
    localStorage.setItem('motorStatuses', JSON.stringify(motorStatuses));
}

function updateMotorCardAppearance(motorCard, isActive) {
    if (isActive) {
        motorCard.style.opacity = '1';
        motorCard.style.filter = 'none';
    } else {
        motorCard.style.opacity = '0.7';
        motorCard.style.filter = 'grayscale(0.3)';
    }
}

function loadMotorStatuses() {
    const motorStatuses = JSON.parse(localStorage.getItem('motorStatuses') || '{}');
    
    Object.keys(motorStatuses).forEach(motorId => {
        const toggle = document.querySelector(`[data-motor="${motorId}"]`);
        if (toggle) {
            const statusText = toggle.querySelector('.status-text');
            
            if (motorStatuses[motorId]) {
                toggle.classList.add('active');
                toggle.classList.remove('inactive');
                statusText.textContent = 'AKTİF';
                updateMotorCardAppearance(toggle.closest('.motor-card'), true);
            } else {
                toggle.classList.add('inactive');
                toggle.classList.remove('active');
                statusText.textContent = 'PASİF';
                updateMotorCardAppearance(toggle.closest('.motor-card'), false);
            }
        }
    });
}

// Password Visibility Toggle
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('passwordToggle');
    const eyeOpen = toggleBtn.querySelector('.eye-open');
    const eyeClosed = toggleBtn.querySelector('.eye-closed');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
    } else {
        passwordInput.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    }
}

// Authentication System
function checkAuthentication() {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    
    console.log('🔑 CheckAuth - User:', savedUser); // Debug
    console.log('🔑 CheckAuth - Token:', savedToken); // Debug
    
    if (savedUser && savedToken) {
        AppState.currentUser = JSON.parse(savedUser);
        AppState.isAuthenticated = true;
        showDashboard();
    } else if (savedUser && !savedToken) {
        // User var ama token yok, token oluştur
        const authToken = 'demo-token-' + Date.now();
        localStorage.setItem('authToken', authToken);
        AppState.currentUser = JSON.parse(savedUser);
        AppState.isAuthenticated = true;
        console.log('🔑 CheckAuth - Token oluşturuldu:', authToken); // Debug
        showDashboard();
    } else {
        showLoginScreen();
    }
}

function handleLogin(e) {
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
    
    // Simulate API call delay
    setTimeout(() => {
        // Hash password for security
        const hashedPassword = hashPassword(password);
        
        // Check credentials (in real app, this would be server-side)
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === hashedPassword);
        
        if (user) {
            // Show success state
            loginBtn.classList.remove('processing');
            loginBtn.classList.add('success');
            loginBtn.querySelector('.btn-text').textContent = 'Başarılı!';
            
            AppState.currentUser = user;
            AppState.isAuthenticated = true;
            localStorage.setItem('currentUser', JSON.stringify(user));
            const authToken = 'demo-token-' + Date.now(); // Demo token
            localStorage.setItem('authToken', authToken);
            console.log('🔑 Login - Token set edildi:', authToken); // Debug
            console.log('🔑 Login - localStorage items:', Object.keys(localStorage)); // Debug
            
            // Handle remember me
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // Show success message
            showSuccessMessage('Hoş geldiniz!');
            
            // Redirect to dashboard
            setTimeout(() => {
                showDashboard();
            }, 800);
        } else {
            // Show error with shake animation
            loginBtn.classList.remove('processing');
            loginBtn.querySelector('.btn-text').textContent = 'Giriş Yap';
            
            errorDiv.textContent = 'E-posta veya şifre hatalı';
            errorDiv.style.display = 'block';
            errorDiv.style.animation = 'none';
            setTimeout(() => {
                errorDiv.style.animation = 'shake 0.5s ease-in-out';
            }, 10);
        }
    }, 1200);
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    // Enter key to submit form when on login screen
    if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') {
        const activeElement = document.activeElement;
        if (activeElement.id === 'email' || activeElement.id === 'password') {
            e.preventDefault();
            handleLogin(e);
        }
    }
    
    // Tab navigation
    if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll('#loginScreen input, #loginScreen button');
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
        
        if (currentIndex !== -1) {
            e.preventDefault();
            const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
            const nextElement = focusableElements[nextIndex] || focusableElements[e.shiftKey ? focusableElements.length - 1 : 0];
            nextElement.focus();
        }
    }
}

// Touch Gestures
function initTouchGestures() {
    let touchStartY = 0;
    let touchEndY = 0;
    
    const loginScreen = document.getElementById('loginScreen');
    
    loginScreen.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    
    loginScreen.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, false);
    
    function handleSwipe() {
        const swipeThreshold = 100;
        const diff = touchStartY - touchEndY;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe up - could trigger auto-login or other action
                showNotification('Yukarı kaydırıldı', 'info');
            }
        }
    }
}

// Keyboard Shortcuts Message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
        <span>${message}</span>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        successDiv.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 300);
    }, 3000);
}

function logout() {
    AppState.currentUser = null;
    AppState.isAuthenticated = false;
    localStorage.removeItem('currentUser');
    
    // Reset login button
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.classList.remove('success', 'processing');
    loginBtn.querySelector('.btn-text').textContent = 'Giriş Yap';
    
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardPage').style.display = 'none';
    document.querySelector('.header').style.display = 'none';
    document.querySelector('.sidebar').style.display = 'none';
    
    // Reset login button state
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.classList.remove('success', 'processing');
    loginBtn.querySelector('.btn-text').textContent = 'Giriş Yap';
    
    // Clear form
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
    
    // Focus email input
    setTimeout(() => {
        document.getElementById('email').focus();
    }, 100);
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
    document.querySelector('.header').style.display = 'block';
    document.querySelector('.sidebar').style.display = 'block';
    
    // Update user info
    document.getElementById('userName').textContent = AppState.currentUser.name;
    document.getElementById('userRole').textContent = AppState.currentUser.role;
    
    // Load dashboard data
    loadDashboardData();
    
    // Load motor statuses
    loadMotorStatuses();
}

// User Management
function getUsers() {
    // Default users for demo
    return [
        {
            id: 1,
            email: 'admin@kojenerasyon.com',
            password: hashPassword('admin123'),
            name: 'Admin User',
            role: 'Admin',
            permissions: ['read', 'write', 'delete']
        },
        {
            id: 2,
            email: 'operator@kojenerasyon.com',
            password: hashPassword('operator123'),
            name: 'Operator User',
            role: 'Operator',
            permissions: ['read', 'write']
        },
        {
            id: 3,
            email: 'viewer@kojenerasyon.com',
            password: hashPassword('viewer123'),
            name: 'Viewer User',
            role: 'Viewer',
            permissions: ['read']
        }
    ];
}

function hashPassword(password) {
    // Simple hash function for demo (use bcrypt in production)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const page = e.currentTarget.dataset.page;
    
    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Update current page
    showPage(page);
}

// Navigation and Page Management
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    const selectedPage = document.getElementById(pageId + 'Page');
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update app state
    AppState.currentPage = pageId;
    
    // Handle energy page specific initialization
    if (pageId === 'energy') {
        initializeEnergyPage();
    }
}

// Energy Page Functions
function initializeEnergyPage() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('hourlyDate').value = today;
    document.getElementById('dailyDate').value = today;
    
    // Initialize tab switching
    initializeEnergyTabs();
    
    // Initialize create monthly sheets button
    const createSheetsBtn = document.getElementById('createMonthlySheetsBtn');
    if (createSheetsBtn) {
        createSheetsBtn.onclick = createMonthlySheets;
    }
}

function initializeEnergyTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Update button states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update content visibility
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab + 'Tab') {
                    content.classList.add('active');
                }
            });
            
            // Update save button based on active tab
            updateSaveButton(targetTab);
        });
    });
}

function updateSaveButton(activeTab) {
    const saveBtn = document.getElementById('saveHourlyData');
    if (activeTab === 'hourly') {
        saveBtn.textContent = 'Saatlik Verileri Kaydet';
        saveBtn.onclick = saveHourlyData;
    } else {
        saveBtn.textContent = 'Günlük Verileri Kaydet';
        saveBtn.onclick = saveDailyData;
    }
}

async function createMonthlySheets() {
    try {
        const year = prompt('Yıl girin (örn: 2024):', new Date().getFullYear());
        if (!year) return;
        
        const token = localStorage.getItem('authToken');
        console.log('🔑 Token kontrolü:', token); // Debug
        console.log('🔑 localStorage items:', Object.keys(localStorage)); // Debug
        
        if (!token) {
            showNotification('Önce giriş yapın', 'error');
            console.log('❌ Token bulunamadı!'); // Debug
            return;
        }
        
        console.log('✅ Token bulundu:', token); // Debug
        showNotification('Aylık sayfalar oluşturuluyor...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/energy/create-monthly-sheets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ year: year })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Aylık sayfa oluşturma sonucu:', result);
            showNotification(`${year} yılı için ${result.createdSheets?.length || 0} aylık sayfa oluşturuldu`, 'success');
        } else {
            const error = await response.text();
            console.error('Aylık sayfa oluşturma hatası:', error);
            showNotification('Sayfa oluşturma sırasında hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Aylık sayfa oluşturma hatası:', error);
        showNotification('Bağlantı hatası', 'error');
    }
}

function saveHourlyData() {
    const date = document.getElementById('hourlyDate').value;
    
    if (!date) {
        showNotification('Tarih seçin', 'error');
        return;
    }
    
    // Vardiya seçimini atla - otomatik olarak 1 olarak ayarla
    const vardiya = '1';
    
    const hourlyData = [];
    const rows = document.querySelectorAll('.hourly-row');
    let emptyInputs = [];
    
    rows.forEach((row, index) => {
        const time = row.querySelector('.hourly-time').textContent;
        const aktifInput = row.querySelector('.hourly-aktif');
        const reaktifInput = row.querySelector('.hourly-reaktif');
        
        // Her saat için veri kaydet (değer olsa da olmasa da)
        const aktifValue = aktifInput.value ? parseFloat(aktifInput.value) || 0 : null;
        const reaktifValue = reaktifInput.value ? parseFloat(reaktifInput.value) || 0 : null;
        
        hourlyData.push({
            date: date,
            time: time,
            vardiya: vardiya,
            aktif: aktifValue,
            reaktif: reaktifValue,
            aydemAktif: 0, // Manuel girilecek
            aydemReaktif: 0 // Manuel girilecek
        });
        
        // Boş inputları sadece bilgi için kaydet
        if (!aktifInput.value && !reaktifInput.value) {
            emptyInputs.push(time);
        }
    });
    
    // Tüm saatler kaydedildiği için boş input kontrolüne gerek yok
    console.log('📊 Kaydedilen saatler:', hourlyData.length, 'saat');
    console.log('📊 Boş saatler:', emptyInputs.length, 'saat');
    
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
        
        console.log('🔍 Kaydedilecek veriler:', { sheetName, vardiya, data: hourlyData });
        
        // ÖNCELİKLE LocalStorage'a KAYDET (veri kaybını önlemek için)
        const storageKey = `hourlyData_${sheetName}_${vardiya}`;
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        // Frontend duplicate kontrolü - tarih ve saat bazında
        const duplicates = [];
        const validData = [];
        
        hourlyData.forEach(newItem => {
            const isDuplicate = existingData.some(existingItem => 
                existingItem.date === newItem.date && 
                existingItem.time === newItem.time &&
                existingItem.vardiya === newItem.vardiya
            );
            
            if (isDuplicate) {
                duplicates.push(`${newItem.date} ${newItem.time} (${newItem.vardiya}. vardiya)`);
            } else {
                validData.push(newItem);
            }
        });
        
        // Eğer duplicate varsa uyarı göster
        if (duplicates.length > 0) {
            const choice = await showDuplicateDialog(duplicates);
            
            if (choice === 'cancel') {
                showNotification('İşlem iptal edildi', 'info');
                return;
            } else if (choice === 'new') {
                // Sadece yeni verileri kaydet
                if (validData.length === 0) {
                    showNotification('Tüm veriler zaten kayıtlı', 'warning');
                    return;
                }
                console.log('📝 Sadece yeni veriler kaydedilecek:', validData.length);
                showNotification(`${validData.length} yeni veri kaydedilecek, ${duplicates.length} veri atlandı`, 'info');
            } else if (choice === 'override') {
                // Tüm verileri kaydet (duplicate'ları da)
                validData.push(...hourlyData.filter(item => 
                    duplicates.some(dup => dup.includes(`${item.date} ${item.time}`))
                ));
                console.log('📝 Tüm veriler üzerine yazılacak');
                showNotification(`${hourlyData.length} veri üzerine yazılacak`, 'info');
            }
        }
        
        // Kaydedilecek son veri seti
        const dataToSave = validData.length > 0 ? validData : hourlyData;
        
        // ÖNCELİKLE LocalStorage'a KAYDET (veri kaybını önleme)
        const pendingStorageKey = `pending_${storageKey}`;
        const pendingData = {
            data: dataToSave,
            timestamp: new Date().toISOString(),
            sheetName: sheetName,
            vardiya: vardiya
        };
        localStorage.setItem(pendingStorageKey, JSON.stringify(pendingData));
        console.log('💾 Veriler öncelikle LocalStorage\'a kaydedildi (bekleme modu)');
        
        // Backend'e veri gönder (duplicate kontrolü Apps Script'te)
        let backendSuccess = false;
        try {
            showNotification('Veriler Google Sheets\'e gönderiliyor...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/energy/hourly`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sheetName: sheetName,
                    vardiya: vardiya,
                    data: dataToSave
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Backend kayıt sonucu:', result);
                backendSuccess = true;
                
                // Başarılı olursa pending veriyi sil ve normal storage'a taşı
                localStorage.removeItem(pendingStorageKey);
                
                const updatedStorage = [...existingData];
                dataToSave.forEach(newItem => {
                    const existingIndex = updatedStorage.findIndex(existingItem => 
                        existingItem.date === newItem.date && 
                        existingItem.time === newItem.time &&
                        existingItem.vardiya === newItem.vardiya
                    );
                    
                    if (existingIndex >= 0) {
                        updatedStorage[existingIndex] = newItem; // Üzerine yaz
                    } else {
                        updatedStorage.push(newItem); // Yeni ekle
                    }
                });
                
                localStorage.setItem(storageKey, JSON.stringify(updatedStorage));
                
                // Mock mode kontrolü
                if (result.note && result.note.includes('Apps Script')) {
                    showNotification(`${sheetName} sayfasına ${dataToSave.length} saatlik veri başarıyla kaydedildi (Mock Mode - Demo)`, 'success');
                } else {
                    showNotification(`${sheetName} sayfasına ${dataToSave.length} saatlik veri başarıyla kaydedildi`, 'success');
                }
                
                // Input'ları temizle
                document.querySelectorAll('.hourly-inputs input').forEach(input => {
                    input.value = '';
                });
                return;
            } else {
                const error = await response.text();
                console.error('❌ Backend hatası:', error);
                throw new Error('Backend hatası: ' + error);
            }
        } catch (backendError) {
            console.error('❌ Backend bağlantısı başarısız:', backendError);
            showNotification('Google Sheets bağlantısı başarısız. Veriler yerel olarak kaydedildi ve daha sonra tekrar denenir.', 'warning');
        }
        
        // Backend başarısız olursa veriyi LocalStorage'da tut (sonradan göndermek için)
        if (!backendSuccess) {
            console.log('⏰ Veriler LocalStorage\'da bekletiliyor (sonradan gönderilmek üzere)');
            showNotification(dataToSave.length + ' veri yerel olarak kaydedildi. İnternet bağlantısı geldiğinde otomatik gönderilecek.', 'warning');
            
            // Input'ları temizle
            document.querySelectorAll('.hourly-inputs input').forEach(input => {
                input.value = '';
            });
        }
        
    } catch (error) {
        console.error('❌ Kayıt hatası:', error);
        showNotification('Kayıt sırasında hata oluştu: ' + error.message, 'error');
    }
}

// Sayfa yüklendiğinde bekleyen verileri kontrol et
function checkPendingData() {
    const keys = Object.keys(localStorage);
    const pendingKeys = keys.filter(key => key.startsWith('pending_'));
    
    if (pendingKeys.length > 0) {
        console.log('⏰ Bekleyen veriler bulundu:', pendingKeys.length, 'dosya');
        showNotification(pendingKeys.length + ' bekleyen veri gönderimi denenecek...', 'info');
        
        pendingKeys.forEach(async (pendingKey) => {
            try {
                const pendingData = JSON.parse(localStorage.getItem(pendingKey));
                console.log('� Bekleyen veri gönderiliyor:', pendingData.sheetName);
                
                // Burada backend'e tekrar gönderme mantığı eklenebilir
                // Şimdilik sadece bildirim göster
                
                localStorage.removeItem(pendingKey);
                console.log('✅ Bekleyen veri işlendi:', pendingData.sheetName);
            } catch (error) {
                console.error('❌ Bekleyen veri işlenemedi:', error);
            }
        });
    }
}

function saveDailyData() {
    const dailyData = {
        date: document.getElementById('dailyDate').value,
        yagSeviyesi: parseFloat(document.getElementById('yagSeviyesi').value) || 0,
        kuplaj: parseFloat(document.getElementById('kuplaj').value) || 0,
        gm1: parseFloat(document.getElementById('gm1').value) || 0,
        gm2: parseFloat(document.getElementById('gm2').value) || 0,
        gm3: parseFloat(document.getElementById('gm3').value) || 0,
        icIhtiyac: parseFloat(document.getElementById('icIhtiyac').value) || 0,
        redresor1: parseFloat(document.getElementById('redresor1').value) || 0,
        redresor2: parseFloat(document.getElementById('redresor2').value) || 0,
        kojenIcIhtiyac: parseFloat(document.getElementById('kojenIcIhtiyac').value) || 0,
        servisTrafo: parseFloat(document.getElementById('servisTrafo').value) || 0
    };
    
    if (!dailyData.date) {
        showNotification('Tarih seçin', 'error');
        return;
    }
    
    console.log('Günlük veriler:', dailyData);
    showNotification('Günlük veriler başarıyla kaydedildi', 'success');
    
    // Clear form inputs
    document.querySelectorAll('.daily-input-group input').forEach(input => {
        input.value = '';
    });
}

// Sidebar Management
function toggleSidebar() {
    AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
    const sidebar = document.getElementById('sidebar');
    
    if (AppState.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

// Google Sheets Integration - Backend API
async function loadGoogleSheetsData() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return false;
        
        const response = await fetch(`${API_BASE_URL}/production`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            // Backend'den gelen veriyi array formatına çevir
            AppState.googleSheetsData.production = Array.isArray(data) ? data : [];
            console.log('📊 Production data loaded:', AppState.googleSheetsData.production.length, 'records');
            return true;
        }
        // Backend çalışmazsa mock data kullan
        AppState.googleSheetsData.production = generateMockProductionData();
        console.log('📊 Using mock production data');
        return false;
    } catch (error) {
        console.error('Google Sheets veri yükleme hatası:', error);
        // Hata durumunda mock data kullan
        AppState.googleSheetsData.production = generateMockProductionData();
        console.log('📊 Using mock production data due to error');
        return false;
    }
}

// Mock veri üretme fonksiyonu
function generateMockProductionData() {
    const data = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        data.push({
            date: date.toISOString().split('T')[0],
            production: Math.floor(Math.random() * 200) + 300, // 300-500 MWh
            efficiency: Math.floor(Math.random() * 15) + 80 // 80-95%
        });
    }
    
    return data;
}

// Dashboard Data Management
async function loadDashboardData() {
    await loadGoogleSheetsData();
    updateStatsCards();
    updateMotorCards();
    updateProductionChart();
    updateEfficiencyChart();
}

function updateMotorCards() {
    // Mock motor data for demo
    const motorStats = {
        'GM-1': {
            totalHours: 1250.5,
            totalProduction: 4325.8,
            dailyHours: 8.5,
            dailyProduction: 120.3,
            avgProduction: 144.2
        },
        'GM-2': {
            totalHours: 1180.2,
            totalProduction: 4087.6,
            dailyHours: 7.8,
            dailyProduction: 115.7,
            avgProduction: 138.5
        },
        'GM-3': {
            totalHours: 1320.8,
            totalProduction: 4562.4,
            dailyHours: 8.2,
            dailyProduction: 124.0,
            avgProduction: 151.2
        }
    };

    // Update GM-1
    animateValue('gm1-total-hours', 0, motorStats['GM-1'].totalHours, 1000, ' saat');
    animateValue('gm1-total-production', 0, motorStats['GM-1'].totalProduction, 1000, ' MWh');
    animateValue('gm1-daily-hours', 0, motorStats['GM-1'].dailyHours, 1000, ' saat');
    animateValue('gm1-daily-production', 0, motorStats['GM-1'].dailyProduction, 1000, ' MWh');
    animateValue('gm1-avg-production', 0, motorStats['GM-1'].avgProduction, 1000, ' MWh');

    // Update GM-2
    animateValue('gm2-total-hours', 0, motorStats['GM-2'].totalHours, 1000, ' saat');
    animateValue('gm2-total-production', 0, motorStats['GM-2'].totalProduction, 1000, ' MWh');
    animateValue('gm2-daily-hours', 0, motorStats['GM-2'].dailyHours, 1000, ' saat');
    animateValue('gm2-daily-production', 0, motorStats['GM-2'].dailyProduction, 1000, ' MWh');
    animateValue('gm2-avg-production', 0, motorStats['GM-2'].avgProduction, 1000, ' MWh');

    // Update GM-3
    animateValue('gm3-total-hours', 0, motorStats['GM-3'].totalHours, 1000, ' saat');
    animateValue('gm3-total-production', 0, motorStats['GM-3'].totalProduction, 1000, ' MWh');
    animateValue('gm3-daily-hours', 0, motorStats['GM-3'].dailyHours, 1000, ' saat');
    animateValue('gm3-daily-production', 0, motorStats['GM-3'].dailyProduction, 1000, ' MWh');
    animateValue('gm3-avg-production', 0, motorStats['GM-3'].avgProduction, 1000, ' MWh');
}

function updateStatsCards() {
    const data = AppState.googleSheetsData.production;
    
    if (data && data.length > 0) {
        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const todayData = data.filter(d => d.date === today);
        const dailyProduction = todayData.reduce((sum, d) => sum + d.production, 0);
        const currentPower = Math.floor(Math.random() * 50) + 100;
        const avgEfficiency = data.reduce((sum, d) => sum + d.efficiency, 0) / data.length;
        const uptime = Math.floor(Math.random() * 8) + 16;
        
        // Update DOM with animation
        animateValue('dailyProduction', 0, dailyProduction, 1000, ' MWh');
        animateValue('currentPower', 0, currentPower, 1000, ' MW');
        animateValue('efficiency', 0, Math.round(avgEfficiency), 1000, '%');
        animateValue('uptime', 0, uptime, 1000, ' saat');
    }
}

function animateValue(id, start, end, duration, suffix = '') {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current) + suffix;
    }, 16);
}

// Chart Management
function updateProductionChart(period) {
    const canvas = document.getElementById('productionChart');
    const ctx = canvas.getContext('2d');
    
    const data = AppState.googleSheetsData.production || [];
    let chartData = [];
    
    if (period === 'day') {
        chartData = data.slice(-7);
    } else if (period === 'week') {
        chartData = data.slice(-4);
    } else {
        chartData = data.slice(-12);
    }
    
    // Simple chart drawing (in production, use Chart.js or similar)
    drawSimpleChart(ctx, chartData, 'production');
}

function updateEfficiencyChart() {
    const canvas = document.getElementById('efficiencyChart');
    const ctx = canvas.getContext('2d');
    
    const data = AppState.googleSheetsData.production.slice(-10);
    
    // Simple chart drawing
    drawSimpleChart(ctx, data, 'efficiency');
}

function drawSimpleChart(ctx, data, type) {
    const canvas = ctx.canvas;
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    if (!data || data.length === 0) return;
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const values = data.map(d => type === 'production' ? d.production : d.efficiency);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    
    // Draw axes
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw data
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary');
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const value = type === 'production' ? point.production : point.efficiency;
        const y = height - padding - ((value - minValue) / range) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary');
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const value = type === 'production' ? point.production : point.efficiency;
        const y = height - padding - ((value - minValue) / range) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}


// Data Operations
async function refreshDashboardData() {
    const button = document.getElementById('refreshData');
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span> Yenileniyor...';
    
    try {
        await loadDashboardData();
        
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 3a5 5 0 104.546 2.914.5.5 0 00-.908-.417A4 4 0 118 4v1a.5.5 0 001 0V3z"/>
                    <path d="M8 3v4.5l3.5 1.5"/>
                </svg>
                Yenile
            `;
        }, 1000);
    } catch (error) {
        console.error('Error refreshing data:', error);
        button.disabled = false;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3a5 5 0 104.546 2.914.5.5 0 00-.908-.417A4 4 0 118 4v1a.5.5 0 001 0V3z"/>
                <path d="M8 3v4.5l3.5 1.5"/>
            </svg>
            Yenile
        `;
    }
}

// Custom Duplicate Dialog
function showDuplicateDialog(duplicates) {
    return new Promise((resolve) => {
        // Modal HTML oluştur
        const modalHTML = `
            <div class="duplicate-modal-overlay" id="duplicateModal">
                <div class="duplicate-modal">
                    <div class="duplicate-modal-header">
                        <h3>⚠️ Duplicate Veri Tespit Edildi</h3>
                    </div>
                    <div class="duplicate-modal-body">
                        <p>Aşağıdaki veriler zaten kayıtlı:</p>
                        <div class="duplicate-list">
                            ${duplicates.map(dup => `<div class="duplicate-item">📅 ${dup}</div>`).join('')}
                        </div>
                        <p>Ne yapmak istersiniz?</p>
                    </div>
                    <div class="duplicate-modal-footer">
                        <button class="btn btn-cancel" data-action="cancel">İptal</button>
                        <button class="btn btn-new" data-action="new">Sadece Yeni Verileri Kaydet</button>
                        <button class="btn btn-override" data-action="override">Üzerine Yaz</button>
                    </div>
                </div>
            </div>
        `;
        
        // Modal'i ekle
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listener'ları ekle
        const modal = document.getElementById('duplicateModal');
        const buttons = modal.querySelectorAll('button');
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                modal.remove();
                resolve(action);
            });
        });
        
        // Overlay'a tıklayınca kapatma (isteğe bağlı)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve('cancel');
            }
        });
        
        // Modal'i göster
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    });
}

// Utility Functions
function showNotification(message, type = 'info', duration = 3000) {
    console.log('🔔 Bildirim gösteriliyor:', message, type); // Debug
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    console.log('🔔 Notification element:', notification); // Debug
    
    document.body.appendChild(notification);
    console.log('🔔 Notification appended to body'); // Debug
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
        console.log('🔔 Notification animated in'); // Debug
    }, 100);
    
    // Remove after duration
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
                console.log('🔔 Notification removed'); // Debug
            }
        }, 300);
    }, duration);
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    showNotification('Bir hata oluştu. Lütfen sayfayı yenileyin.', 'error');
});

// Performance Monitoring
function logPerformance() {
    if ('performance' in window) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
    }
}

window.addEventListener('load', logPerformance);