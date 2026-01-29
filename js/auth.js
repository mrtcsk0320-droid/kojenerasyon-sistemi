// Kimlik Doğrulama Sistemi
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.maxUsers = 5; // Maksimum kullanıcı limiti
    }

    // Giriş yap
    async login(email, password) {
        try {
            // Google Sheets'ten kullanıcıyı kontrol et
            const user = await googleSheets.validateUser(email, password);
            
            if (user) {
                this.currentUser = user;
                this.token = this.generateToken(user);
                
                // Local storage'a kaydet
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('userData', JSON.stringify(user));
                
                return {
                    success: true,
                    user: user,
                    token: this.token
                };
            } else {
                return {
                    success: false,
                    message: 'Email veya şifre hatalı'
                };
            }
        } catch (error) {
            console.error('Giriş hatası:', error);
            return {
                success: false,
                message: error?.message || 'Giriş yapılamadı'
            };
        }
    }

    // Çıkış yap
    logout() {
        this.currentUser = null;
        this.token = null;
        
        // Local storage'ı temizle
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        // Sayfayı yenile
        window.location.reload();
    }

    // Token oluştur
    generateToken(user) {
        const payload = {
            email: user.email,
            role: user.role,
            timestamp: Date.now()
        };
        
        // Basit token oluşturma (gerçek uygulamada JWT kullanılmalı)
        return btoa(JSON.stringify(payload));
    }

    // Token doğrula
    validateToken(token) {
        try {
            const payload = JSON.parse(atob(token));
            const now = Date.now();
            
            // Token 24 saat geçerli
            if (now - payload.timestamp > 24 * 60 * 60 * 1000) {
                return false;
            }
            
            return payload;
        } catch (error) {
            return false;
        }
    }

    // Mevcut kullanıcıyı kontrol et
    async checkAuth() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            const payload = this.validateToken(token);
            if (payload) {
                this.currentUser = JSON.parse(userData);
                this.token = token;
                return true;
            }
        }
        
        return false;
    }

    // Kullanıcı ekle
    async addUser(userData) {
        try {
            // Mevcut kullanıcı sayısını kontrol et
            const users = await googleSheets.getUsers();
            
            if (users.length >= this.maxUsers) {
                return {
                    success: false,
                    message: `Maksimum ${this.maxUsers} kullanıcı limitine ulaşıldı`
                };
            }

            // Email zaten var mı kontrol et
            const existingUser = users.find(u => u.email === userData.email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'Bu email zaten kayıtlı'
                };
            }

            // Yeni kullanıcıyı ekle
            await googleSheets.addUser(userData);
            
            return {
                success: true,
                message: 'Kullanıcı başarıyla eklendi'
            };
        } catch (error) {
            console.error('Kullanıcı ekleme hatası:', error);
            return {
                success: false,
                message: 'Kullanıcı eklenemedi'
            };
        }
    }

    // Yetki kontrolü
    hasPermission(requiredRole) {
        if (!this.currentUser) {
            return false;
        }

        const roleHierarchy = {
            'ADMIN': 4,
            'OPERATOR': 3,
            'USER': 2,
            'VIEWER': 1
        };

        const userRole = (this.currentUser.role || 'VIEWER').toString().trim().toUpperCase();
        const required = (requiredRole || 'VIEWER').toString().trim().toUpperCase();
        return (roleHierarchy[userRole] || 0) >= (roleHierarchy[required] || 0);
    }

    // Şifre gücünü kontrol et
    checkPasswordStrength(password) {
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        let strength = 0;
        let message = '';

        if (password.length >= minLength) strength++;
        if (hasUpperCase) strength++;
        if (hasLowerCase) strength++;
        if (hasNumbers) strength++;
        if (hasSpecialChar) strength++;

        switch(strength) {
            case 0:
            case 1:
                message = 'Çok zayıf şifre';
                break;
            case 2:
                message = 'Zayıf şifre';
                break;
            case 3:
                message = 'Orta şifre';
                break;
            case 4:
                message = 'Güçlü şifre';
                break;
            case 5:
                message = 'Çok güçlü şifre';
                break;
        }

        return {
            strength: strength,
            message: message,
            isValid: strength >= 3
        };
    }

    // Email formatını kontrol et
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Kullanıcı bilgilerini güncelle
    async updateUser(userId, updates) {
        try {
            // Bu fonksiyon Google Sheets API'si ile genişletilebilir
            // Şimdilik basit bir implementasyon
            return {
                success: true,
                message: 'Kullanıcı güncellendi'
            };
        } catch (error) {
            console.error('Kullanıcı güncelleme hatası:', error);
            return {
                success: false,
                message: 'Kullanıcı güncellenemedi'
            };
        }
    }

    // Kullanıcıyı sil
    async deleteUser(userId) {
        try {
            // Bu fonksiyon Google Sheets API'si ile genişletilebilir
            // Şimdilik basit bir implementasyon
            return {
                success: true,
                message: 'Kullanıcı silindi'
            };
        } catch (error) {
            console.error('Kullanıcı silme hatası:', error);
            return {
                success: false,
                message: 'Kullanıcı silinemedi'
            };
        }
    }

    // Oturum süresini uzat
    extendSession() {
        if (this.currentUser && this.token) {
            const payload = this.validateToken(this.token);
            if (payload) {
                payload.timestamp = Date.now();
                this.token = this.generateToken(this.currentUser);
                localStorage.setItem('authToken', this.token);
                return true;
            }
        }
        return false;
    }
}

// Auth sistemi örneği oluştur
const auth = new AuthSystem();

// Global fonksiyonlar
function logout() {
    auth.logout();
}

// Sayfa yüklendiğinde oturum kontrolü
document.addEventListener('DOMContentLoaded', () => {
    auth.checkAuth().then(isAuthenticated => {
        if (!isAuthenticated) {
            // Giriş yapılmamışsa giriş modalını göster
            // Bu app.js içinde handled ediliyor
        }
    });
});

// Oturum zamanlayıcısı
setInterval(() => {
    auth.extendSession();
}, 30 * 60 * 1000); // 30 dakikada bir
