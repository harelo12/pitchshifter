const fs = require('fs/promises');
const path = require('path');
const { appConfig } = require('../config/appConfig');
const { ensureDirectory, removeFileSafe } = require('../utils/fsUtils');
const { logger } = require('../utils/logger');

const ensureStorageReady = async () => {
  await Promise.all([
    ensureDirectory(appConfig.upload.paths.uploadDir),
    ensureDirectory(appConfig.upload.paths.processedDir),
    ensureDirectory(appConfig.upload.paths.tempDir)
  ]);
};

const removeExpiredFiles = async (directoryPath, expirationMs) => {
  const files = await fs.readdir(directoryPath);
  const now = Date.now();

  await Promise.all(files.map(async fileName => {
    const fullPath = path.join(directoryPath, fileName);
    const stats = await fs.stat(fullPath);
    const ageMs = now - stats.mtimeMs;

    if (ageMs > expirationMs) {
      await removeFileSafe(fullPath);
    }
  }));
};

const scheduleCleanupTask = () => {
  const intervalMs = 15 * 60 * 1000;
  const expirationMs = appConfig.upload.retention.keepFilesMinutes * 60 * 1000;

  setInterval(async () => {
    try {
      await removeExpiredFiles(appConfig.upload.paths.uploadDir, expirationMs);
      await removeExpiredFiles(appConfig.upload.paths.processedDir, expirationMs);
    } catch (error) {
      logger.error('Error durante la limpieza de archivos temporales', { error: error.message });
    }
  }, intervalMs);
};

module.exports = {
  ensureStorageReady,
  scheduleCleanupTask,
  removeFileSafe
};
