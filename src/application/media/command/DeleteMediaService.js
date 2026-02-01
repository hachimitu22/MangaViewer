const MediaId = require('../../../domain/media/mediaId');

class DeleteMediaServiceInput {
  constructor({ id }) {
    this.id = id;
  }
}

class DeleteMediaService {
  #mediaRepository;

  constructor({ mediaRepository }) {
    if (!mediaRepository || typeof mediaRepository.delete !== 'function' || typeof mediaRepository.findByMediaId !== 'function') {
      throw new Error();
    }

    this.#mediaRepository = mediaRepository;
  }

  async execute(input) {
    if (!(input instanceof DeleteMediaServiceInput)) {
      throw new Error();
    }

    // メディア存在チェック
    const mediaId = new MediaId(input.id);
    const media = await this.#mediaRepository.findByMediaId(mediaId);
    if (!media) {
      throw new Error();
    }

    // メディア削除
    await this.#mediaRepository.delete(media);
  }
}

module.exports = {
  DeleteMediaServiceInput,
  DeleteMediaService,
};
