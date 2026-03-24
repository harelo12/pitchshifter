const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toArray = (value, fallback) => {
  if (!value) return fallback;
  return value
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
};

const projectRoot = path.resolve(__dirname, '../..');

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
  frontendSuccessRedirect: process.env.FRONTEND_SUCCESS_REDIRECT || 'http://localhost:5173/auth/success',
  frontendFailureRedirect: process.env.FRONTEND_FAILURE_REDIRECT || 'http://localhost:5173/auth/error',
  maxFileSizeMb: toNumber(process.env.MAX_FILE_SIZE_MB, 100),
  allowedInputFormats: toArray(process.env.ALLOWED_INPUT_FORMATS, ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac']),
  allowedOutputFormats: toArray(process.env.ALLOWED_OUTPUT_FORMATS, ['wav', 'mp3', 'flac', 'ogg']),
  defaultOutputFormat: (process.env.DEFAULT_OUTPUT_FORMAT || 'wav').toLowerCase(),
  uploadDir: process.env.UPLOAD_DIR || path.join(projectRoot, 'storage/uploads'),
  processedDir: process.env.PROCESSED_DIR || path.join(projectRoot, 'storage/processed'),
  tempDir: process.env.TEMP_DIR || path.join(projectRoot, 'storage/temp'),
  keepFilesMinutes: toNumber(process.env.KEEP_FILES_MINUTES, 60),
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
  apiRateLimitWindowMs: toNumber(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  apiRateLimitMaxRequests: toNumber(process.env.API_RATE_LIMIT_MAX_REQUESTS, 60)
};

module.exports = { env };
