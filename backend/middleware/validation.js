const Joi = require('joi');

const schemas = {
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Geçerli bir e-posta adresi girin',
      'any.required': 'E-posta adresi gerekli'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Şifre en az 6 karakter olmalı',
      'any.required': 'Şifre gerekli'
    })
  }),

  register: Joi.object({
    ad: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Ad en az 2 karakter olmalı',
      'string.max': 'Ad en fazla 50 karakter olabilir',
      'any.required': 'Ad gerekli'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Geçerli bir e-posta adresi girin',
      'any.required': 'E-posta adresi gerekli'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Şifre en az 6 karakter olmalı',
      'any.required': 'Şifre gerekli'
    }),
    rol: Joi.string().valid('Admin', 'Operator', 'Viewer').optional().messages({
      'any.only': 'Rol sadece Admin, Operator veya Viewer olabilir'
    })
  }),

  production: Joi.object({
    tarih: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
      'string.pattern.base': 'Tarih YYYY-MM-DD formatında olmalı',
      'any.required': 'Tarih gerekli'
    }),
    vardiya: Joi.string().valid('Sabah', 'Öğle', 'Gece').required().messages({
      'any.only': 'Vardiya sadece Sabah, Öğle veya Gece olabilir',
      'any.required': 'Vardiya gerekli'
    }),
    uretimMWh: Joi.number().min(0).max(10000).required().messages({
      'number.min': 'Üretim değeri 0 veya daha büyük olmalı',
      'number.max': 'Üretim değeri 10000 MWh\'den küçük olmalı',
      'any.required': 'Üretim değeri gerekli'
    }),
    verimlilikYuzde: Joi.number().min(0).max(100).required().messages({
      'number.min': 'Verimlilik 0-100 arasında olmalı',
      'number.max': 'Verimlilik 0-100 arasında olmalı',
      'any.required': 'Verimlilik gerekli'
    }),
    durum: Joi.string().valid('active', 'maintenance', 'inactive').optional().messages({
      'any.only': 'Durum sadece active, maintenance veya inactive olabilir'
    })
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Doğrulama hatası',
        errors: errors
      });
    }
    
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Sorgu parametreleri doğrulama hatası',
        errors: errors
      });
    }
    
    next();
  };
};

const querySchemas = {
  production: Joi.object({
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    limit: Joi.number().integer().min(1).max(1000).optional()
  })
};

module.exports = {
  schemas,
  validate,
  validateQuery,
  querySchemas
};
