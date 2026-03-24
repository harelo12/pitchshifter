const { Router } = require('express');
const { healthRouter } = require('./healthRoutes');
const { authRouter } = require('./authRoutes');
const { pitchRouter } = require('./pitchRoutes');

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/pitch', pitchRouter);

module.exports = { apiRouter };
