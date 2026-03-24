const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');
const { appConfig } = require('./config/appConfig');
require('./config/passport');
const { apiRateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { apiRouter } = require('./routes');

const app = express();

app.locals.config = appConfig;

app.use(helmet());
app.use(cors({
  origin: appConfig.security.cors.allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(apiRateLimiter);
app.use(session({
  secret: appConfig.auth.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: appConfig.server.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/v1', apiRouter);

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada'
  });
});

app.use(errorHandler);

module.exports = { app };
