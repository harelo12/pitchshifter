const { Router } = require('express');
const { processPitch, getProcessingConfig } = require('../controllers/pitchController');
const { requireAuth } = require('../middleware/requireAuth');
const { uploadAudio } = require('../middleware/uploadMiddleware');

const pitchRouter = Router();

pitchRouter.get('/config', requireAuth, getProcessingConfig);
pitchRouter.post('/process', requireAuth, uploadAudio.single('audio'), processPitch);

module.exports = { pitchRouter };
