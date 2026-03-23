const {
  DeleteMediaServiceInput,
} = require('../../application/media/command/DeleteMediaService');

class MediaDeleteController {
  #deleteMediaService;

  constructor({ deleteMediaService }) {
    if (!deleteMediaService || typeof deleteMediaService.execute !== 'function') {
      throw new Error();
    }

    this.#deleteMediaService = deleteMediaService;
  }

  async execute(req, res) {
    try {
      const mediaId = req?.params?.mediaId;

      if (!this.#validateMediaId(mediaId)) {
        return this.#fail(res);
      }

      const input = new DeleteMediaServiceInput({
        id: mediaId,
      });

      await this.#deleteMediaService.execute(input);

      return res.status(200).json({
        code: 0,
      });
    } catch (_error) {
      return this.#fail(res);
    }
  }

  #validateMediaId(mediaId) {
    return typeof mediaId === 'string' && mediaId.length > 0;
  }

  #fail(res) {
    return res.status(200).json({
      code: 1,
    });
  }
}

module.exports = MediaDeleteController;
