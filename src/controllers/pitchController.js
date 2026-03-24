const { asyncHandler } = require('../utils/asyncHandler');
const { validateUploadedAudio, validatePitchShiftParams } = require('../services/fileValidationService');
const { processPitchShift } = require('../services/audioProcessingService');
const { removeFileSafe } = require('../services/storageService');

const processPitch = asyncHandler(async (req, res) => {
  const { semitones, outputFormat } = req.body;
  const validatedParams = validatePitchShiftParams({ semitones, outputFormat });
  const fileInfo = await validateUploadedAudio(req.file);

  try {
    const result = await processPitchShift({
      inputPath: fileInfo.path,
      semitones: validatedParams.semitones,
      outputFormat: validatedParams.outputFormat
    });

    return res.download(result.outputPath, `pitch-shifted.${result.outputFormat}`, async error => {
      await removeFileSafe(fileInfo.path);
      if (!error) {
        await removeFileSafe(result.outputPath);
      }
    });
  } catch (error) {
    await removeFileSafe(fileInfo.path);
    throw error;
  }
});

const getProcessingConfig = (req, res) => {
  res.json({
    maxFileSizeBytes: req.app.locals.config.upload.maxFileSizeBytes,
    allowedInputFormats: req.app.locals.config.upload.allowedInputFormats,
    allowedOutputFormats: req.app.locals.config.upload.allowedOutputFormats,
    defaultOutputFormat: req.app.locals.config.upload.defaultOutputFormat,
    semitoneRange: {
      min: -24,
      max: 24
    }
  });
};

module.exports = {
  processPitch,
  getProcessingConfig
};
