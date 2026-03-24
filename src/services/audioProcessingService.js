const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { appConfig } = require('../config/appConfig');
const { AppError } = require('../errors/AppError');

const buildAtempoChain = (tempoFactor) => {
  const factors = [];
  let remaining = tempoFactor;

  while (remaining < 0.5) {
    factors.push(0.5);
    remaining /= 0.5;
  }

  while (remaining > 2.0) {
    factors.push(2.0);
    remaining /= 2.0;
  }

  factors.push(Number(remaining.toFixed(6)));
  return factors.map(value => `atempo=${value}`).join(',');
};

const runProcess = (binary, args) => new Promise((resolve, reject) => {
  const processRef = spawn(binary, args, {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stderr = '';
  processRef.stderr.on('data', chunk => {
    stderr += chunk.toString();
  });

  processRef.on('error', error => {
    reject(new AppError(`No se pudo ejecutar ${binary}: ${error.message}`, 500));
  });

  processRef.on('close', code => {
    if (code !== 0) {
      return reject(new AppError('Error al procesar audio con FFmpeg.', 500, { stderr }));
    }

    resolve();
  });
});

const getSampleRate = async (inputPath) => {
  const args = [
    '-v', 'error',
    '-select_streams', 'a:0',
    '-show_entries', 'stream=sample_rate',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    inputPath
  ];

  return new Promise((resolve, reject) => {
    const processRef = spawn(appConfig.ffmpeg.probePath, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    processRef.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    processRef.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    processRef.on('error', error => {
      reject(new AppError(`No se pudo ejecutar ffprobe: ${error.message}`, 500));
    });

    processRef.on('close', code => {
      if (code !== 0) {
        return reject(new AppError('No se pudo analizar el audio de entrada.', 400, { stderr }));
      }

      const parsed = Number(stdout.trim());
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return reject(new AppError('No se pudo determinar el sample rate del audio.', 400));
      }

      resolve(parsed);
    });
  });
};

const processPitchShift = async ({ inputPath, semitones, outputFormat }) => {
  const sampleRate = await getSampleRate(inputPath);
  const pitchFactor = 2 ** (semitones / 12);
  const targetRate = sampleRate * pitchFactor;
  const tempoChain = buildAtempoChain(1 / pitchFactor);

  const outputFileName = `${Date.now()}-${uuidv4()}.${outputFormat}`;
  const outputPath = path.join(appConfig.upload.paths.processedDir, outputFileName);
  const audioFilter = `asetrate=${targetRate},aresample=${sampleRate},${tempoChain}`;

  const args = [
    '-hide_banner',
    '-loglevel', 'error',
    '-i', inputPath,
    '-vn',
    '-af', audioFilter,
    '-y',
    outputPath
  ];

  await runProcess(appConfig.ffmpeg.binaryPath, args);

  return {
    outputPath,
    outputFileName,
    outputFormat
  };
};

module.exports = { processPitchShift };
