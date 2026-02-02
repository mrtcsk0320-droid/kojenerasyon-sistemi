const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const googleSheetsService = require('./googleSheetsService');

class AuthService {
  async hashPassword(password) {
    try {
      const saltRounds = config.security.bcryptRounds;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Şifre hashleme hatası');
    }
  }

  async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error comparing password:', error);
      throw new Error('Şifre karşılaştırma hatası');
    }
  }

  generateToken(user) {
    try {
      const payload = {
        id: user.id,
        email: user.email,
        name: user.ad,
        role: user.rol
      };

      return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Token oluşturma hatası');
    }
  }

  async login(email, password) {
    try {
      const users = await googleSheetsService.getUsers();
      const user = users.find(u => u.email === email && u.aktif);

      if (!user) {
        throw new Error('Kullanıcı bulunamadı veya pasif');
      }

      const isPasswordValid = await this.comparePassword(password, user.sifreHash);

      if (!isPasswordValid) {
        throw new Error('Geçersiz şifre');
      }

      const token = this.generateToken(user);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.ad,
          role: user.rol
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const users = await googleSheetsService.getUsers();
      const existingUser = users.find(u => u.email === userData.email);

      if (existingUser) {
        throw new Error('Bu e-posta adresi zaten kayıtlı');
      }

      const hashedPassword = await this.hashPassword(userData.password);

      const newUser = {
        ad: userData.ad,
        email: userData.email,
        sifreHash: hashedPassword,
        rol: userData.rol || 'Viewer',
        aktif: true
      };

      await googleSheetsService.addUser(newUser);

      return {
        success: true,
        message: 'Kullanıcı başarıyla oluşturuldu'
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error('Geçersiz token');
    }
  }

  async initializeDefaultUsers() {
    try {
      const users = await googleSheetsService.getUsers();
      
      if (users.length === 0) {
        const defaultUsers = [
          {
            ad: 'Admin User',
            email: 'admin@kojenerasyon.com',
            password: 'admin123',
            rol: 'Admin'
          },
          {
            ad: 'Operator User',
            email: 'operator@kojenerasyon.com',
            password: 'operator123',
            rol: 'Operator'
          },
          {
            ad: 'Viewer User',
            email: 'viewer@kojenerasyon.com',
            password: 'viewer123',
            rol: 'Viewer'
          }
        ];

        for (const user of defaultUsers) {
          await this.register(user);
        }

        console.log('Default users initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing default users:', error);
    }
  }
}

module.exports = new AuthService();
