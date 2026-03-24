const multer = require('multer');
const { AppError } = require('../errors/AppError');
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }


  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'El archivo excede el tamaño máximo permitido.'
      });
    }

    return res.status(400).json({
      error: 'Error al subir archivo.',
      details: err.message
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  return res.status(500).json({
    error: 'Error interno del servidor'
  });
};

module.exports = { errorHandler };
