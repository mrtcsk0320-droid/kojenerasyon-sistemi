const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Erişim için token gerekli'
    });
  }

  // Demo token için özel kontrol
  if (token.startsWith('demo-token-')) {
    req.user = {
      id: 1,
      email: 'admin@kojenerasyon.com',
      password: '-969161597',
      name: 'Admin User',
      role: 'Admin',
      permissions: ['read', 'write', 'delete']
    };
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Geçersiz token'
      });
    }

    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı doğrulanamadı'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz bulunmuyor'
      });
    }

    next();
  };
};

const checkPermissions = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı doğrulanamadı'
      });
    }

    const rolePermissions = {
      'Admin': ['read', 'write', 'delete'],
      'Operator': ['read', 'write'],
      'Viewer': ['read']
    };

    const userPermissions = rolePermissions[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `${permission} izni için yetkiniz bulunmuyor`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  checkPermissions
};
