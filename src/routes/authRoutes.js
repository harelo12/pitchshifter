const { Router } = require('express');
const passport = require('passport');
const { appConfig } = require('../config/appConfig');
const {
  getSessionUser,
  logout,
  authFailureRedirect,
  authSuccessRedirect
} = require('../controllers/authController');
const { AppError } = require('../errors/AppError');

const authRouter = Router();

const ensureGoogleAuthConfigured = (req, res, next) => {
  if (!appConfig.auth.google.clientId || !appConfig.auth.google.clientSecret) {
    throw new AppError('Google OAuth no está configurado en el servidor.', 503);
  }
  next();
};

authRouter.get('/google', ensureGoogleAuthConfigured, passport.authenticate('google', { scope: ['profile', 'email'] }));
authRouter.get('/google/callback',
  ensureGoogleAuthConfigured,
  passport.authenticate('google', { failureRedirect: '/api/v1/auth/failure', session: true }),
  authSuccessRedirect
);
authRouter.get('/failure', authFailureRedirect);
authRouter.get('/me', getSessionUser);
authRouter.post('/logout', logout);

module.exports = { authRouter };
