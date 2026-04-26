const path = require('path');

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
]);

const isSupportedImageExtension = (filename) => {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false;
  }

  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.has(ext);
};

const isTargetZipFilename = (filename) => {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false;
  }

  return /\.zip$/i.test(filename);
};

const isDirectZipEntry = (entryName) => {
  if (typeof entryName !== 'string' || entryName.length === 0) {
    return false;
  }

  return !entryName.includes('/');
};

const getBasename = (entryName) => {
  const ext = path.extname(entryName);
  return path.basename(entryName, ext);
};

const sortEntryNamesByNaturalBasename = (entryNames) => {
  if (!Array.isArray(entryNames)) {
    throw new Error('entryNames must be an array');
  }
  if (!entryNames.every(entryName => typeof entryName === 'string')) {
    throw new Error('entryNames must be an array of strings');
  }

  const sorted = [...entryNames];
  sorted.sort((left, right) => {
    const leftBasename = getBasename(left);
    const rightBasename = getBasename(right);

    const baseCompare = leftBasename.localeCompare(rightBasename, undefined, {
      numeric: true,
      sensitivity: 'variant',
    });

    if (baseCompare !== 0) {
      return baseCompare;
    }

    return left.localeCompare(right, undefined, {
      numeric: true,
      sensitivity: 'variant',
    });
  });

  return sorted;
};

const decideExitCode = ({ successCount, failureCount } = {}) => {
  if (!Number.isInteger(successCount) || successCount < 0) {
    throw new Error('successCount must be a non-negative integer');
  }
  if (!Number.isInteger(failureCount) || failureCount < 0) {
    throw new Error('failureCount must be a non-negative integer');
  }

  if (successCount === 0 && failureCount === 0) {
    return 0;
  }
  if (successCount > 0 && failureCount === 0) {
    return 0;
  }
  if (successCount > 0 && failureCount > 0) {
    return 1;
  }

  return 2;
};

const validateImportTarget = ({ hasArg, exists, readable, isDirectory } = {}) => {
  if (!hasArg) {
    return { ok: false, exitCode: 3, reason: 'missing-arg' };
  }

  if (!exists || !readable) {
    return { ok: false, exitCode: 3, reason: 'unreadable-target' };
  }

  if (!isDirectory) {
    return { ok: false, exitCode: 4, reason: 'not-directory' };
  }

  return { ok: true };
};

module.exports = {
  isSupportedImageExtension,
  isTargetZipFilename,
  isDirectZipEntry,
  sortEntryNamesByNaturalBasename,
  decideExitCode,
  validateImportTarget,
};
