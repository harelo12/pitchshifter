const { AppError } = require('../errors/AppError');

const requireAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  throw new AppError('Usuario no autenticado', 401);
};

module.exports = { requireAuth };
