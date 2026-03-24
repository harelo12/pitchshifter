const { Router } = require('express');
const { healthCheck } = require('../controllers/healthController');

const healthRouter = Router();

healthRouter.get('/', healthCheck);

module.exports = { healthRouter };
