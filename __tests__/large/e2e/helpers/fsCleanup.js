const fs = require('fs/promises');

const removePathIfExists = async targetPath => {
  if (!targetPath) {
    return;
  }

  await fs.rm(targetPath, {
    recursive: true,
    force: true,
  });
};

module.exports = {
  removePathIfExists,
};
