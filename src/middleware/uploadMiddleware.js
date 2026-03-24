const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { appConfig } = require('../config/appConfig');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, appConfig.upload.paths.uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uuidv4()}${extension}`);
  }
});

const uploadAudio = multer({
  storage,
  limits: {
    fileSize: appConfig.upload.maxFileSizeBytes,
    files: 1
  }
});

module.exports = { uploadAudio };
