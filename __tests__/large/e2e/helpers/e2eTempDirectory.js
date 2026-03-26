const fs = require('fs/promises');
const path = require('path');

const e2eDataRootDirectory = path.join(__dirname, '..', '.e2e-data');

const createE2eTempDirectory = async prefix => {
  await fs.mkdir(e2eDataRootDirectory, { recursive: true });
  return fs.mkdtemp(path.join(e2eDataRootDirectory, prefix));
};

module.exports = {
  createE2eTempDirectory,
};
