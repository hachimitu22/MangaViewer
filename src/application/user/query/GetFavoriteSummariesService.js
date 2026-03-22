const UserId = require('../../../domain/user/userId');

class Input {
  constructor({ userId }) {
    if (typeof userId !== 'string' || userId.length === 0) {
      throw new Error();
    }

    this.userId = userId;
  }
}

const isMediaOverviewLike = (obj) => {
  if (typeof obj?.mediaId !== 'string') return false;
  if (typeof obj?.title !== 'string') return false;
  if (typeof obj?.thumbnail !== 'string') return false;
  if (!(obj?.tags instanceof Array)) return false;
  if (!obj.tags.every(tag => ['category', 'label'].every(prop => prop in tag))) return false;
  if (!(obj?.priorityCategories instanceof Array)) return false;
  if (!obj.priorityCategories.every(category => typeof category === 'string')) return false;
  return true;
};

class Output {
  constructor({ mediaOverviews }) {
    if (!(mediaOverviews instanceof Array) || !mediaOverviews.every(isMediaOverviewLike)) {
      throw new Error();
    }

    this.mediaOverviews = mediaOverviews;
  }
}

class GetFavoriteSummariesService {
  #userRepository;
  #mediaQueryRepository;

  constructor({ userRepository, mediaQueryRepository }) {
    if (!userRepository || typeof userRepository.findByUserId !== 'function') {
      throw new Error();
    }
    if (!mediaQueryRepository || typeof mediaQueryRepository.findOverviewsByMediaIds !== 'function') {
      throw new Error();
    }

    this.#userRepository = userRepository;
    this.#mediaQueryRepository = mediaQueryRepository;
  }

  async execute(input) {
    if (!(input instanceof Input)) {
      throw new Error();
    }

    const user = await this.#userRepository.findByUserId(new UserId(input.userId));
    if (!user) {
      return new Output({ mediaOverviews: [] });
    }

    const mediaIds = user.getFavorites().map(mediaId => mediaId.getId());
    if (mediaIds.length === 0) {
      return new Output({ mediaOverviews: [] });
    }

    const mediaOverviews = await this.#mediaQueryRepository.findOverviewsByMediaIds(mediaIds);
    return new Output({ mediaOverviews });
  }
}

module.exports = {
  Input,
  Output,
  GetFavoriteSummariesService,
};
