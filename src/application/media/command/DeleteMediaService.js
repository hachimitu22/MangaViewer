const MediaId = require('../../../domain/media/mediaId');

class DeleteMediaServiceInput {
  constructor({ id }) {
    this.id = id;
  }
}

class DeleteMediaService {
  #mediaRepository;
  #unitOfWork;

  constructor({ mediaRepository, unitOfWork }) {
    if (!mediaRepository || typeof mediaRepository.delete !== 'function' || typeof mediaRepository.findByMediaId !== 'function') {
      throw new Error();
    }

    if (!unitOfWork || typeof unitOfWork.run !== 'function') {
      throw new Error();
    }

    this.#mediaRepository = mediaRepository;
    this.#unitOfWork = unitOfWork;
  }

  async execute(input) {
    if (!(input instanceof DeleteMediaServiceInput)) {
      throw new Error();
    }

    return this.#unitOfWork.run(async () => {
      // メディア存在チェック
    const mediaId = new MediaId(input.id);
    const media = await this.#mediaRepository.findByMediaId(mediaId);
    if (!media) {
      throw new Error();
    }

    // メディア削除
      await this.#mediaRepository.delete(media);
    });
  }
}

module.exports = {
  DeleteMediaServiceInput,
  DeleteMediaService,
};
