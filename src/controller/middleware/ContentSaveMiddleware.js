class ContentSaveMiddleware {
  #contentStorage;

  constructor({ contentStorage }) {
    if (!contentStorage || typeof contentStorage.save !== 'function') {
      throw new Error();
    }

    this.#contentStorage = contentStorage;
  }

  async execute(req, res, next) {
    try {
      const contents = req?.body?.contents;
      if (!this.#validateContents(contents)) {
        return this.#fail(res);
      }

      const sortedContents = [...contents].sort((a, b) => a.position - b.position);
      const contentIds = await this.#contentStorage.save(sortedContents);

      if (!this.#validateContentIds(contentIds, sortedContents.length)) {
        return this.#fail(res);
      }

      if (!req.context || typeof req.context !== 'object') {
        req.context = {};
      }

      req.context.contentIds = contentIds;

      if (typeof next === 'function') {
        return next();
      }

      return undefined;
    } catch (error) {
      return this.#fail(res);
    }
  }

  #fail(res) {
    return res.status(200).json({
      code: 1,
    });
  }

  #validateContents(contents) {
    if (!Array.isArray(contents) || contents.length === 0) {
      return false;
    }

    const positions = [];

    for (const content of contents) {
      if (!content || typeof content !== 'object') {
        return false;
      }

      if (!this.#validateFile(content.file)) {
        return false;
      }

      if (!Number.isInteger(content.position)) {
        return false;
      }

      positions.push(content.position);
    }

    positions.sort((a, b) => a - b);

    for (let index = 0; index < positions.length; index += 1) {
      if (positions[index] !== index + 1) {
        return false;
      }
    }

    return true;
  }

  #validateFile(file) {
    if (Array.isArray(file)) {
      return file.length > 0 && file.every(value => this.#hasValue(value));
    }

    return this.#hasValue(file);
  }

  #hasValue(value) {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.length > 0;
    }

    return true;
  }

  #validateContentIds(contentIds, expectedLength) {
    if (!Array.isArray(contentIds) || contentIds.length !== expectedLength) {
      return false;
    }

    for (const contentId of contentIds) {
      if (!(typeof contentId === 'string' && contentId.length > 0)) {
        return false;
      }
    }

    return true;
  }
}

module.exports = ContentSaveMiddleware;
