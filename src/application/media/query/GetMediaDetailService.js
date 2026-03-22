const MediaId = require('../../../domain/media/mediaId');

// SearchCondition と同じなので継承だけで済ます
class Input {
  constructor({ id }) {
    if (typeof id !== 'string') {
      throw new Error();
    }

    this.id = id;
  }
}

class Output {
  constructor({ mediaDetail }) {
    if (typeof mediaDetail.id !== 'string') {
      throw new Error();
    }
    if (typeof mediaDetail.title !== 'string') {
      throw new Error();
    }
    if (!(mediaDetail.contents instanceof Array) || !mediaDetail.contents.every(content => typeof content === 'string')) {
      throw new Error();
    }
    if (!(mediaDetail.tags instanceof Array) || !mediaDetail.tags.every(tag => ['category', 'label'].every(prop => prop in tag))) {
      throw new Error();
    }
    if (!(mediaDetail.priorityCategories instanceof Array) || !mediaDetail.priorityCategories.every(pc => typeof pc === 'string')) {
      throw new Error();
    }

    this.mediaDetail = mediaDetail;
  }
}

class GetMediaDetailService {
  #mediaRepository;

  constructor({ mediaRepository }) {
    if (!mediaRepository || typeof mediaRepository.findByMediaId !== 'function') {
      throw new Error();
    }

    this.#mediaRepository = mediaRepository;
  }

  async execute(input) {
    if (!(input instanceof Input)) {
      throw new Error();
    }

    const mediaId = new MediaId(input.id);
    const media = await this.#mediaRepository.findByMediaId(mediaId);

    if (!media) {
      throw new Error();
    }

    const output = new Output({
      mediaDetail: {
        id: media.getId().getId(),
        title: media.getTitle().getTitle(),
        contents: media.getContents().map(content => content.getId()),
        tags: media.getTags().map(tag => ({
          category: tag.getCategory().getValue(),
          label: tag.getLabel().getLabel(),
        })),
        priorityCategories: media.getPriorityCategories().map(pc => pc.getValue()),
      },
    });

    return output;
  }
}

module.exports = {
  Input,
  Output,
  GetMediaDetailService,
};
