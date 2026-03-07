const {
  RegisterMediaServiceInput,
} = require('../application/media/command/RegisterMediaService');

class MediaPostController {
  #registerMediaService;

  constructor({ registerMediaService }) {
    if (!registerMediaService || typeof registerMediaService.execute !== 'function') {
      throw new Error();
    }

    this.#registerMediaService = registerMediaService;
  }

  async execute(req, res) {
    try {
      const title = req?.body?.title;
      const tags = req?.body?.tags;
      const contentIds = req?.context?.contentIds;

      if (!this.#validateTitle(title)
        || !this.#validateTags(tags)
        || !this.#validateContentIds(contentIds)) {
        return this.#fail(res);
      }

      const input = new RegisterMediaServiceInput({
        title,
        contents: contentIds,
        tags,
        priorityCategories: this.#createPriorityCategories(tags),
      });

      const output = await this.#registerMediaService.execute(input);

      return res.status(200).json({
        code: 0,
        mediaId: output.mediaId,
      });
    } catch (error) {
      return this.#fail(res);
    }
  }


  #createPriorityCategories(tags) {
    return [...new Set(tags.map(tag => tag.category))];
  }

  #fail(res) {
    return res.status(200).json({
      code: 1,
    });
  }

  #validateTitle(title) {
    return typeof title === 'string' && title.length > 0;
  }

  #validateTags(tags) {
    if (!Array.isArray(tags)) {
      return false;
    }

    for (const tag of tags) {
      if (!tag || typeof tag !== 'object') {
        return false;
      }

      if (!(typeof tag.category === 'string' && tag.category.length > 0
        && typeof tag.label === 'string' && tag.label.length > 0)) {
        return false;
      }
    }

    return true;
  }

  #validateContentIds(contentIds) {
    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return false;
    }

    for (const id of contentIds) {
      if (!(typeof id === 'string' && id.length > 0)) {
        return false;
      }
    }

    return new Set(contentIds).size === contentIds.length;
  }
}

module.exports = MediaPostController;
