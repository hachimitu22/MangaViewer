const MediaId = require('../../../domain/media/mediaId');
const FoundContent = require('../../../domain/media/foundContent');
const NotFoundContent = require('../../../domain/media/notFoundContent');

// SearchCondition と同じなので継承だけで済ます
class Input {
  constructor({ mediaId, contentPosition }) {
    if (typeof mediaId !== 'string') {
      throw new Error();
    }
    if (typeof contentPosition !== 'number' || contentPosition <= 0 || !Number.isInteger(contentPosition)) {
      throw new Error();
    }

    this.mediaId = mediaId;
    this.contentPosition = contentPosition;
  }
}

class Result {
  constructor() { }
}

class FoundResult extends Result {
  constructor({ contentId, previousContentId, nextContentId }) {
    super();

    if (typeof contentId !== 'string' && contentId !== null) {
      throw new Error();
    }
    if (typeof previousContentId !== 'string' && previousContentId !== null) {
      throw new Error();
    }
    if (typeof nextContentId !== 'string' && nextContentId !== null) {
      throw new Error();
    }

    this.contentId = contentId;
    this.previousContentId = previousContentId;
    this.nextContentId = nextContentId;
  }
}

class ContentNotFoundResult extends Result {
  constructor() {
    super();
  }
}

class MediaNotFoundResult extends Result {
  constructor() {
    super();
  }
}

class GetMediaContentWithNavigationService {
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
      return new MediaNotFoundResult();
    }

    const results = media.getContentsByPositions([
      input.contentPosition,
      input.contentPosition - 1,
      input.contentPosition + 1,
    ]);
    const contentIds = results.map(result => {
      if (result instanceof FoundContent) {
        return result.contentId.getId();
      } else if (result instanceof NotFoundContent) {
        return null;
      } else {
        throw new Error();
      }
    });

    if (contentIds[0] === null) {
      return new ContentNotFoundResult();
    }

    return new FoundResult({
      contentId: contentIds[0],
      previousContentId: contentIds[1],
      nextContentId: contentIds[2],
    });
  }
}

module.exports = {
  Input,
  FoundResult,
  MediaNotFoundResult,
  ContentNotFoundResult,
  GetMediaContentWithNavigationService,
};
