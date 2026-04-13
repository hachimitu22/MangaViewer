const MediaId = require('../../../domain/media/mediaId');

// SearchCondition と同じなので継承だけで済ます
class Input {
  constructor({ mediaId }) {
    if (typeof mediaId !== 'string') {
      throw new Error();
    }

    this.mediaId = mediaId;
  }
}

const isContentLike = content => ['id', 'thumbnail', 'position'].every(prop => prop in content)
  && typeof content.id === 'string'
  && typeof content.thumbnail === 'string'
  && typeof content.position === 'number';

class Output {
  constructor({ mediaDetail }) {
    if (typeof mediaDetail.id !== 'string') {
      throw new Error();
    }
    if (typeof mediaDetail.title !== 'string') {
      throw new Error();
    }
    if (typeof mediaDetail.registeredAt !== 'string') {
      throw new Error();
    }
    if (!(mediaDetail.contents instanceof Array) || !mediaDetail.contents.every(isContentLike)) {
      throw new Error();
    }
    if (!(mediaDetail.tags instanceof Array) || !mediaDetail.tags.every(tag => ['category', 'label'].every(prop => prop in tag))) {
      throw new Error();
    }
    if (!(mediaDetail.categories instanceof Array) || !mediaDetail.categories.every(category => typeof category === 'string')) {
      throw new Error();
    }
    if (!(mediaDetail.priorityCategories instanceof Array) || !mediaDetail.priorityCategories.every(pc => typeof pc === 'string')) {
      throw new Error();
    }

    this.mediaDetail = mediaDetail;
  }
}

const createCategories = tags => [...new Set(tags.map(tag => tag.category))];

const formatRegisteredAt = registeredAt => {
  if (!(registeredAt instanceof Date) || Number.isNaN(registeredAt.getTime())) {
    return '';
  }

  const year = registeredAt.getUTCFullYear();
  const month = String(registeredAt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(registeredAt.getUTCDate()).padStart(2, '0');
  const hours = String(registeredAt.getUTCHours()).padStart(2, '0');
  const minutes = String(registeredAt.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
};

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

    const mediaId = new MediaId(input.mediaId);
    const media = await this.#mediaRepository.findByMediaId(mediaId);

    if (!media) {
      throw new Error();
    }

    const tags = media.getTags().map(tag => ({
      category: tag.getCategory().getValue(),
      label: tag.getLabel().getLabel(),
    }));

    const output = new Output({
      mediaDetail: {
        id: media.getId().getId(),
        title: media.getTitle().getTitle(),
        registeredAt: formatRegisteredAt(media.getRegisteredAt?.() ?? null),
        contents: media.getContents().map((content, index) => ({
          id: content.getId(),
          thumbnail: content.getId(),
          position: index + 1,
        })),
        tags,
        categories: createCategories(tags),
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
