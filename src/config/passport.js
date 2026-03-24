const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { appConfig } = require('./appConfig');

const users = new Map();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  done(null, users.get(id) || null);
});

if (appConfig.auth.google.clientId && appConfig.auth.google.clientSecret) {
  passport.use(new GoogleStrategy(
    {
      clientID: appConfig.auth.google.clientId,
      clientSecret: appConfig.auth.google.clientSecret,
      callbackURL: appConfig.auth.google.callbackUrl
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        emails: profile.emails || []
      };
      users.set(user.id, user);
      done(null, user);
    }
  ));
}

module.exports = { passport };
