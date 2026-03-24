const { appConfig } = require('../config/appConfig');

const getSessionUser = (req, res) => {
  res.json({
    authenticated: Boolean(req.user),
    user: req.user || null
  });
};

const logout = (req, res, next) => {
  req.logout(error => {
    if (error) {
      return next(error);
    }

    req.session.destroy(() => {
      res.status(204).send();
    });
  });
};

const authFailureRedirect = (req, res) => {
  res.redirect(appConfig.auth.frontendFailureRedirect);
};

const authSuccessRedirect = (req, res) => {
  res.redirect(appConfig.auth.frontendSuccessRedirect);
};

module.exports = {
  getSessionUser,
  logout,
  authFailureRedirect,
  authSuccessRedirect
};
