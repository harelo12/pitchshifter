const fs = require('fs/promises');

const ensureDirectory = async dirPath => {
  await fs.mkdir(dirPath, { recursive: true });
};

const removeFileSafe = async filePath => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

module.exports = { ensureDirectory, removeFileSafe };
