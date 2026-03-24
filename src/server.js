const { app } = require('./app');
const { appConfig } = require('./config/appConfig');
const { ensureStorageReady, scheduleCleanupTask } = require('./services/storageService');
const { logger } = require('./utils/logger');

const startServer = async () => {
  await ensureStorageReady();
  scheduleCleanupTask();

  app.listen(appConfig.server.port, () => {
    logger.info('Servidor iniciado', {
      port: appConfig.server.port,
      env: appConfig.server.nodeEnv
    });
  });
};

startServer().catch(error => {
  logger.error('No se pudo iniciar el servidor', { error: error.message });
  process.exit(1);
});
