const path = require('path');
const { env } = require('./env');

const maxFileSizeBytes = env.maxFileSizeMb * 1024 * 1024;

if (!env.allowedOutputFormats.includes(env.defaultOutputFormat)) {
  throw new Error('DEFAULT_OUTPUT_FORMAT debe existir en ALLOWED_OUTPUT_FORMATS.');
}

const appConfig = {
  server: {
    nodeEnv: env.nodeEnv,
    port: env.port,
    appBaseUrl: env.appBaseUrl
  },
  auth: {
    sessionSecret: env.sessionSecret,
    frontendSuccessRedirect: env.frontendSuccessRedirect,
    frontendFailureRedirect: env.frontendFailureRedirect,
    google: {
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackUrl: env.googleCallbackUrl
    }
  },
  upload: {
    maxFileSizeBytes,
    allowedInputFormats: env.allowedInputFormats,
    allowedOutputFormats: env.allowedOutputFormats,
    defaultOutputFormat: env.defaultOutputFormat,
    paths: {
      uploadDir: path.resolve(env.uploadDir),
      processedDir: path.resolve(env.processedDir),
      tempDir: path.resolve(env.tempDir)
    },
    retention: {
      keepFilesMinutes: env.keepFilesMinutes
    }
  },
  ffmpeg: {
    binaryPath: env.ffmpegPath,
    probePath: env.ffprobePath
  },
  security: {
    rateLimit: {
      windowMs: env.apiRateLimitWindowMs,
      max: env.apiRateLimitMaxRequests
    },
    cors: {
      allowedOrigins: env.corsAllowedOrigins
    }
  }
};

module.exports = { appConfig };
