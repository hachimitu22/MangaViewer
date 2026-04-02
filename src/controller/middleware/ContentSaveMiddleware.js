class ContentSaveMiddleware {
  #contentUploadAdapter;

  constructor({ contentUploadAdapter }) {
    if (!contentUploadAdapter || typeof contentUploadAdapter.execute !== 'function') {
      throw new Error();
    }

    this.#contentUploadAdapter = contentUploadAdapter;
  }

  async execute(req, res, next) {
    const logger = req.app?.locals?.dependencies?.logger;
    try {
      await this.#executeUpload(req, res);

      const contentIds = req?.context?.contentIds;
      if (!this.#validateContentIds(contentIds)) {
        return this.#fail(res);
      }

      if (typeof next === 'function') {
        return next();
      }

      return undefined;
    } catch (error) {
      logger?.error('content.upload.error', {
        request_id: req?.context?.requestId,
        message: error?.message,
        error,
      });
      return this.#fail(res);
    }
  }

  async #executeUpload(req, res) {
    await new Promise((resolve, reject) => {
      this.#contentUploadAdapter.execute(req, res, error => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  #fail(res) {
    return res.status(200).json({
      code: 1,
    });
  }

  #validateContentIds(contentIds) {
    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return false;
    }

    for (const contentId of contentIds) {
      if (!(typeof contentId === 'string' && contentId.length > 0)) {
        return false;
      }
    }

    return new Set(contentIds).size === contentIds.length;
  }
}

module.exports = ContentSaveMiddleware;
