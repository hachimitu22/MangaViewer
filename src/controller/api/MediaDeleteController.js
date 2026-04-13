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
        return this.#failValidation(res);
      }

      const input = new DeleteMediaServiceInput({
        id: mediaId,
      });

      await this.#deleteMediaService.execute(input);

      return res.status(200).json({
        code: 0,
      });
    } catch (_error) {
      return this.#failServerError(res);
    }
  }

  #validateMediaId(mediaId) {
    return typeof mediaId === 'string' && mediaId.length > 0;
  }

  #failValidation(res) {
    return res.status(400).json({
      message: 'Bad Request',
    });
  }

  #failServerError(res) {
    return res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

module.exports = MediaDeleteController;
