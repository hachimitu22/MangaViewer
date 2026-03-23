const {
  UpdateMediaServiceInput,
} = require('../../application/media/command/UpdateMediaService');

class MediaPatchController {
  #updateMediaService;

  constructor({ updateMediaService }) {
    if (!updateMediaService || typeof updateMediaService.execute !== 'function') {
      throw new Error();
    }

    this.#updateMediaService = updateMediaService;
  }

  async execute(req, res) {
    try {
      const mediaId = req?.params?.mediaId;
      const title = req?.body?.title;
      const tags = req?.body?.tags;
      const contentIds = req?.context?.contentIds;

      if (!this.#validateMediaId(mediaId)
        || !this.#validateTitle(title)
        || !this.#validateTags(tags)
        || !this.#validateContentIds(contentIds)) {
        return this.#fail(res);
      }

      const input = new UpdateMediaServiceInput({
        id: mediaId,
        title,
        contents: contentIds,
        tags,
        priorityCategories: this.#createPriorityCategories(tags),
      });

      await this.#updateMediaService.execute(input);

      return res.status(200).json({
        code: 0,
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

  #validateMediaId(mediaId) {
    return typeof mediaId === 'string' && mediaId.length > 0;
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

    for (const contentId of contentIds) {
      if (!(typeof contentId === 'string' && contentId.length > 0)) {
        return false;
      }
    }

    return new Set(contentIds).size === contentIds.length;
  }
}

module.exports = MediaPatchController;
