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
      const uploadReason = this.#resolveUploadReason(error);
      logger?.error('content.upload.error', {
        request_id: req?.context?.requestId,
        message: error?.message,
        reason: uploadReason,
        code: error?.code,
        error,
      });
      return this.#fail(res, error);
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

  #fail(res, error = null) {
    return res.status(this.#resolveHttpStatus(error)).json({
      code: 1,
    });
  }

  #resolveHttpStatus(error) {
    const status = Number(error?.status);
    if (Number.isInteger(status) && status >= 400 && status < 500) {
      return status;
    }

    return 200;
  }

  #resolveUploadReason(error) {
    if (typeof error?.uploadReason === 'string' && error.uploadReason.length > 0) {
      return error.uploadReason;
    }

    if (error?.code === 'LIMIT_FILE_SIZE') {
      return 'size';
    }

    if (error?.code?.startsWith('LIMIT_')) {
      return 'count';
    }

    return 'unknown';
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
