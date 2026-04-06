const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const multer = require('multer');

const IContentUploadAdapter = require('../controller/middleware/adapter/IContentUploadAdapter');

const MAX_FILES = 100;
const MAX_FIELDS = 500;
const MAX_PARTS = 600;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const FILE_FIELD_PATTERN = /^contents\[(\d+)\]\[file\]$/;
const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);
const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);
const ALLOWED_MIME_TYPES = new Set([...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES]);

const SIGNATURE_VALIDATORS = {
  'image/jpeg': header => header.length >= 3
    && header[0] === 0xff
    && header[1] === 0xd8
    && header[2] === 0xff,
  'image/png': header => header.length >= 8
    && header[0] === 0x89
    && header[1] === 0x50
    && header[2] === 0x4e
    && header[3] === 0x47
    && header[4] === 0x0d
    && header[5] === 0x0a
    && header[6] === 0x1a
    && header[7] === 0x0a,
  'image/gif': header => header.length >= 6
    && String.fromCharCode(...header.subarray(0, 6)).match(/^GIF8[79]a$/) !== null,
  'image/webp': header => header.length >= 12
    && String.fromCharCode(...header.subarray(0, 4)) === 'RIFF'
    && String.fromCharCode(...header.subarray(8, 12)) === 'WEBP',
  'video/mp4': header => header.length >= 12
    && String.fromCharCode(...header.subarray(4, 8)) === 'ftyp',
  'video/webm': header => header.length >= 4
    && header[0] === 0x1a
    && header[1] === 0x45
    && header[2] === 0xdf
    && header[3] === 0xa3,
  'video/quicktime': header => header.length >= 12
    && String.fromCharCode(...header.subarray(4, 8)) === 'ftyp'
    && String.fromCharCode(...header.subarray(8, 12)) === 'qt  ',
};

const createUploadError = ({ message, status = 400, reason, code }) => {
  const error = new Error(message);
  error.status = status;
  error.uploadReason = reason;
  if (code) {
    error.code = code;
  }
  return error;
};

const createAllowedFields = () => Array.from({ length: MAX_FILES }, (_, index) => ({
  name: `contents[${index}][file]`,
  maxCount: 1,
}));

module.exports = class MulterDiskStorageContentUploadAdapter extends IContentUploadAdapter {
  #rootDirectory;

  #upload;

  #logger;

  constructor({ rootDirectory, logger = console }) {
    super();

    if (!(typeof rootDirectory === 'string' && rootDirectory.length > 0)) {
      throw new Error();
    }

    this.#rootDirectory = rootDirectory;
    this.#logger = (typeof logger?.warn === 'function') ? logger : console;
    this.#upload = multer({
      storage: multer.diskStorage({
        destination: (_req, file, cb) => {
          try {
            const contentId = this.#createUniqueContentId();
            const directory = this.#createContentDirectory(contentId);
            fs.mkdirSync(directory, { recursive: true });
            file.generatedContentId = contentId;
            cb(null, directory);
          } catch (error) {
            cb(error);
          }
        },
        filename: (_req, file, cb) => {
          if (!(typeof file.generatedContentId === 'string' && file.generatedContentId.length > 0)) {
            cb(new Error('generatedContentId is required'));
            return;
          }

          cb(null, file.generatedContentId);
        },
      }),
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES,
        fields: MAX_FIELDS,
        parts: MAX_PARTS,
      },
      fileFilter: (_req, file, cb) => {
        if (!FILE_FIELD_PATTERN.test(file.fieldname ?? '')) {
          cb(createUploadError({
            message: 'invalid file fieldname',
            reason: 'count',
            code: 'LIMIT_UNEXPECTED_FILE',
          }));
          return;
        }

        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(createUploadError({
            message: 'invalid mime type',
            reason: 'type',
            code: 'LIMIT_UNEXPECTED_FILE',
          }));
          return;
        }

        cb(null, true);
      },
    }).fields(createAllowedFields());
  }

  execute(req, res, cb) {
    this.#upload(req, res, error => {
      if (error) {
        cb(this.#normalizeUploadError(error));
        return;
      }

      const uploadedFilePaths = this.#collectUploadedFilePaths(req?.files ?? {});
      try {
        this.#validateFileSignatures(req?.files ?? {});
        req.context = req.context ?? {};
        req.context.contentIds = this.#createContentIds(req);
        cb();
      } catch (processingError) {
        this.#cleanupUploadedFiles(uploadedFilePaths)
          .finally(() => cb(processingError));
      }
    });
  }

  #collectUploadedFilePaths(filesByField) {
    return Object.values(filesByField)
      .flat()
      .map(file => file?.path)
      .filter(filePath => typeof filePath === 'string' && filePath.length > 0);
  }

  async #cleanupUploadedFiles(filePaths) {
    for (const filePath of new Set(filePaths)) {
      await this.#cleanupUploadedFile(filePath);
    }
  }

  async #cleanupUploadedFile(filePath) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        this.#logger.warn('failed to remove uploaded file', {
          filePath,
          error,
        });
        return;
      }
    }

    await this.#cleanupEmptyDirectories(path.dirname(filePath));
  }

  async #cleanupEmptyDirectories(startDirectory) {
    const rootDirectory = path.resolve(this.#rootDirectory);
    let currentDirectory = path.resolve(startDirectory);

    while (currentDirectory !== rootDirectory) {
      const relativePath = path.relative(rootDirectory, currentDirectory);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        break;
      }

      try {
        await fs.promises.rmdir(currentDirectory);
      } catch (error) {
        if (error?.code === 'ENOENT') {
          currentDirectory = path.dirname(currentDirectory);
          continue;
        }

        if (error?.code === 'ENOTEMPTY' || error?.code === 'EEXIST') {
          break;
        }

        this.#logger.warn('failed to remove empty upload directory', {
          directory: currentDirectory,
          error,
        });
        break;
      }

      currentDirectory = path.dirname(currentDirectory);
    }
  }

  #normalizeUploadError(error) {
    if (error?.uploadReason) {
      return error;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return createUploadError({ message: 'file size limit exceeded', reason: 'size', code: error.code });
      }

      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_FIELD_COUNT' || error.code === 'LIMIT_PART_COUNT') {
        return createUploadError({ message: 'upload count limit exceeded', reason: 'count', code: error.code });
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return createUploadError({ message: 'unexpected file field', reason: 'count', code: error.code });
      }

      return createUploadError({ message: error.message, reason: 'count', code: error.code });
    }

    return error;
  }

  #validateFileSignatures(filesByField) {
    const files = Object.values(filesByField).flat();

    for (const file of files) {
      if (!file?.path || !file?.mimetype) {
        continue;
      }

      const validator = SIGNATURE_VALIDATORS[file.mimetype];
      if (!validator) {
        continue;
      }

      const header = this.#readFileHeader(file.path, 16);
      if (!validator(header)) {
        throw createUploadError({
          message: 'invalid file signature',
          reason: 'type',
          code: 'INVALID_FILE_SIGNATURE',
        });
      }
    }
  }

  #readFileHeader(filePath, length) {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buffer = Buffer.alloc(length);
      const bytesRead = fs.readSync(fd, buffer, 0, length, 0);
      return buffer.subarray(0, bytesRead);
    } finally {
      fs.closeSync(fd);
    }
  }

  #createContentIds(req) {
    const requestContents = req?.body?.contents;
    if (!requestContents || typeof requestContents !== 'object') {
      throw new Error('contents are required');
    }

    const uploadedFilesByIndex = this.#createUploadedFilesByIndex(req?.files ?? {});
    const contents = Object.entries(requestContents).map(([index, content]) => this.#createContent({
      index,
      content,
      uploadedFile: uploadedFilesByIndex.get(index) ?? null,
    }));

    if (contents.length === 0) {
      throw new Error('contents are required');
    }

    const positions = contents.map(content => content.position);
    if (new Set(positions).size !== positions.length) {
      throw new Error('duplicate position');
    }

    return contents
      .sort((left, right) => left.position - right.position)
      .map(content => content.contentId);
  }

  #createUploadedFilesByIndex(filesByField) {
    const uploadedFilesByIndex = new Map();

    for (const file of Object.values(filesByField).flat()) {
      const matched = file?.fieldname?.match(FILE_FIELD_PATTERN);
      if (!matched) {
        throw new Error('invalid file fieldname');
      }

      const index = matched[1];
      if (uploadedFilesByIndex.has(index)) {
        throw new Error('duplicate file field');
      }

      uploadedFilesByIndex.set(index, file);
    }

    return uploadedFilesByIndex;
  }

  #createContent({ index, content, uploadedFile }) {
    if (!content || typeof content !== 'object') {
      throw new Error('content is invalid');
    }

    const position = Number(content.position);
    if (!Number.isInteger(position) || position < 1) {
      throw new Error('position is invalid');
    }

    const hasFile = uploadedFile !== null;
    const contentId = this.#readExistingContentId(content);
    const hasExistingContentId = contentId !== null;

    if (hasFile === hasExistingContentId) {
      throw new Error('file xor id is required');
    }

    if (hasFile) {
      if (!(/^[0-9a-f]{32}$/).test(uploadedFile.generatedContentId ?? '')) {
        throw new Error('generated contentId is invalid');
      }

      return {
        index,
        position,
        contentId: uploadedFile.generatedContentId,
      };
    }

    if (!(/^[0-9a-f]{32}$/).test(contentId)) {
      throw new Error('contentId is invalid');
    }

    return {
      index,
      position,
      contentId,
    };
  }

  #readExistingContentId(content) {
    if (typeof content.id === 'string' && content.id.length > 0) {
      return this.#extractContentId(content.id);
    }

    if (typeof content.url === 'string' && content.url.length > 0) {
      return this.#extractContentId(content.url);
    }

    return null;
  }

  #extractContentId(rawValue) {
    if (!(typeof rawValue === 'string' && rawValue.length > 0)) {
      return null;
    }

    const normalized = rawValue.trim();
    if ((/^[0-9a-f]{32}$/).test(normalized)) {
      return normalized;
    }

    const matched = normalized.match(/([0-9a-f]{32})(?:\?.*)?$/);
    if (!matched) {
      return normalized;
    }

    return matched[1];
  }

  #createUniqueContentId() {
    let contentId = this.#generateContentId();
    while (fs.existsSync(this.#createContentPath(contentId))) {
      contentId = this.#generateContentId();
    }

    return contentId;
  }

  #generateContentId() {
    return crypto.randomUUID().replace(/-/g, '').toLowerCase();
  }

  #createContentDirectory(contentId) {
    return path.join(this.#rootDirectory, ...this.#createPathSegments(contentId));
  }

  #createContentPath(contentId) {
    return path.join(this.#createContentDirectory(contentId), contentId);
  }

  #createPathSegments(contentId) {
    return [
      contentId.slice(0, 2),
      contentId.slice(2, 4),
      contentId.slice(4, 6),
      contentId.slice(6, 8),
    ];
  }
};
