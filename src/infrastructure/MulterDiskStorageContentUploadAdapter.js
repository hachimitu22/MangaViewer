const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const multer = require('multer');

const IContentUploadAdapter = require('../controller/middleware/adapter/IContentUploadAdapter');

module.exports = class MulterDiskStorageContentUploadAdapter extends IContentUploadAdapter {
  #rootDirectory;

  #upload;

  constructor({ rootDirectory }) {
    super();

    if (!(typeof rootDirectory === 'string' && rootDirectory.length > 0)) {
      throw new Error();
    }

    this.#rootDirectory = rootDirectory;
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
    }).any();
  }

  execute(req, res, cb) {
    this.#upload(req, res, error => {
      if (error) {
        cb(error);
        return;
      }

      try {
        req.context = req.context ?? {};
        req.context.contentIds = this.#createContentIds(req);
        cb();
      } catch (processingError) {
        cb(processingError);
      }
    });
  }

  #createContentIds(req) {
    const requestContents = req?.body?.contents;
    if (!requestContents || typeof requestContents !== 'object') {
      throw new Error('contents are required');
    }

    const uploadedFilesByIndex = this.#createUploadedFilesByIndex(req?.files ?? []);
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

  #createUploadedFilesByIndex(files) {
    const uploadedFilesByIndex = new Map();

    for (const file of files) {
      const matched = file?.fieldname?.match(/^contents\[(\d+)\]\[file\]$/);
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
      return content.id;
    }

    if (typeof content.url === 'string' && content.url.length > 0) {
      return content.url;
    }

    return null;
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
