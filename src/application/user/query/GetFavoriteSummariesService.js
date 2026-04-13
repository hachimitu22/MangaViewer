const UserId = require('../../../domain/user/userId');

const PAGE_SIZE = 20;
const SORT_TYPES = Object.freeze({
  DATE_ASC: 'date_asc',
  DATE_DESC: 'date_desc',
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc',
});
const DEFAULT_SORT = SORT_TYPES.DATE_ASC;

class Input {
  constructor({ userId, sort = DEFAULT_SORT, page = 1 } = {}) {
    if (typeof userId !== 'string' || userId.length === 0) {
      throw new Error();
    }
    if (!Object.values(SORT_TYPES).includes(sort)) {
      throw new Error();
    }
    if (typeof page !== 'number' || page <= 0 || !Number.isInteger(page)) {
      throw new Error();
    }

    this.userId = userId;
    this.sort = sort;
    this.page = page;
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
  constructor({ mediaOverviews, totalCount }) {
    if (!(mediaOverviews instanceof Array) || !mediaOverviews.every(isMediaOverviewLike)) {
      throw new Error();
    }
    if (typeof totalCount !== 'number' || totalCount < 0 || !Number.isInteger(totalCount)) {
      throw new Error();
    }

    this.mediaOverviews = mediaOverviews;
    this.totalCount = totalCount;
  }
}

const compareByTitle = (direction) => (a, b) => {
  const result = a.title.localeCompare(b.title, 'ja');
  if (result !== 0) {
    return direction === 'asc' ? result : result * -1;
  }
  return a.mediaId.localeCompare(b.mediaId, 'ja');
};

const sortMediaOverviews = ({ mediaOverviews, sort }) => {
  switch (sort) {
    case SORT_TYPES.DATE_ASC:
      // findByUserId が「新しい追加順（DESC）」で favorites を返す前提のため、古い順は反転する。
      return [...mediaOverviews].reverse();
    case SORT_TYPES.DATE_DESC:
      // findByUserId の返却順（新しい順）をそのまま利用する。
      return [...mediaOverviews];
    case SORT_TYPES.TITLE_ASC:
      return [...mediaOverviews].sort(compareByTitle('asc'));
    case SORT_TYPES.TITLE_DESC:
      return [...mediaOverviews].sort(compareByTitle('desc'));
    default:
      throw new Error();
  }
};

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
      return new Output({ mediaOverviews: [], totalCount: 0 });
    }

    const mediaIds = user.getFavorites().map(mediaId => mediaId.getId());
    if (mediaIds.length === 0) {
      return new Output({ mediaOverviews: [], totalCount: 0 });
    }

    const mediaOverviews = await this.#mediaQueryRepository.findOverviewsByMediaIds(mediaIds);
    const sortedMediaOverviews = sortMediaOverviews({ mediaOverviews, sort: input.sort });
    const totalCount = sortedMediaOverviews.length;
    const start = (input.page - 1) * PAGE_SIZE;
    return new Output({
      mediaOverviews: sortedMediaOverviews.slice(start, start + PAGE_SIZE),
      totalCount,
    });
  }
}

module.exports = {
  PAGE_SIZE,
  SORT_TYPES,
  DEFAULT_SORT,
  Input,
  Output,
  GetFavoriteSummariesService,
};
