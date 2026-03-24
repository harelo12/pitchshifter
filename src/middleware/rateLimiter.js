const rateLimit = require('express-rate-limit');
const { appConfig } = require('../config/appConfig');

const apiRateLimiter = rateLimit({
  windowMs: appConfig.security.rateLimit.windowMs,
  max: appConfig.security.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
  }
});

module.exports = { apiRateLimiter };
