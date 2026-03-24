const fs = require('fs/promises');
const { fileTypeFromBuffer } = require('file-type');
const { appConfig } = require('../config/appConfig');
const { AppError } = require('../errors/AppError');

const mimeToFormatMap = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/flac': 'flac',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac'
};

const detectAudioFormat = async filePath => {
  const handle = await fs.open(filePath, 'r');
  const chunk = Buffer.alloc(4100);

  try {
    await handle.read(chunk, 0, 4100, 0);
  } finally {
    await handle.close();
  }

  const detectedType = await fileTypeFromBuffer(chunk);
  if (detectedType && mimeToFormatMap[detectedType.mime]) {
    return mimeToFormatMap[detectedType.mime];
  }

  const riffHeader = chunk.subarray(0, 4).toString('ascii');
  if (riffHeader === 'RIFF' && chunk.subarray(8, 12).toString('ascii') === 'WAVE') {
    return 'wav';
  }

  if (chunk.subarray(0, 4).toString('ascii') === 'fLaC') {
    return 'flac';
  }

  throw new AppError('No se pudo detectar un formato de audio válido.', 400);
};

const validateUploadedAudio = async file => {
  if (!file) {
    throw new AppError('No se recibió archivo de audio.', 400);
  }

  const detectedFormat = await detectAudioFormat(file.path);

  if (!appConfig.upload.allowedInputFormats.includes(detectedFormat)) {
    throw new AppError('Formato de entrada no permitido.', 400, {
      detectedFormat,
      allowedFormats: appConfig.upload.allowedInputFormats
    });
  }

  return {
    detectedFormat,
    size: file.size,
    path: file.path,
    originalName: file.originalname
  };
};

const validatePitchShiftParams = ({ semitones, outputFormat }) => {
  const parsedSemitones = Number(semitones);
  if (!Number.isFinite(parsedSemitones) || parsedSemitones < -24 || parsedSemitones > 24) {
    throw new AppError('El parámetro semitones debe estar entre -24 y 24.', 400);
  }

  const normalizedOutputFormat = (outputFormat || appConfig.upload.defaultOutputFormat).toLowerCase();
  if (!appConfig.upload.allowedOutputFormats.includes(normalizedOutputFormat)) {
    throw new AppError('Formato de salida no permitido.', 400, {
      allowedFormats: appConfig.upload.allowedOutputFormats
    });
  }

  return {
    semitones: parsedSemitones,
    outputFormat: normalizedOutputFormat
  };
};

module.exports = {
  validateUploadedAudio,
  validatePitchShiftParams
};
