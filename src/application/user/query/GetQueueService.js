const UserId = require('../../../domain/user/userId');

const DEFAULT_PAGE_SIZE = 20;
const INPUT_SORT_TYPES = Object.freeze({
  DATE_DESC: 'date_desc',
  DATE_ASC: 'date_asc',
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc',
});

class Input {
  constructor({ userId, sort = INPUT_SORT_TYPES.DATE_DESC, queuePage, start } = {}) {
    if (typeof userId !== 'string' || userId.length === 0) {
      throw new Error();
    }
    if (!Object.values(INPUT_SORT_TYPES).includes(sort)) {
      throw new Error();
    }
    if (queuePage !== undefined && (!Number.isInteger(queuePage) || queuePage <= 0)) {
      throw new Error();
    }
    if (start !== undefined && (!Number.isInteger(start) || start <= 0)) {
      throw new Error();
    }

    const resolvedStart = start ?? (((queuePage ?? 1) - 1) * DEFAULT_PAGE_SIZE) + 1;
    const resolvedQueuePage = queuePage ?? Math.floor((resolvedStart - 1) / DEFAULT_PAGE_SIZE) + 1;

    this.userId = userId;
    this.sort = sort;
    this.queuePage = resolvedQueuePage;
    this.start = resolvedStart;
    this.pageSize = DEFAULT_PAGE_SIZE;
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

const isDisplayMediaOverviewLike = (obj) => isMediaOverviewLike(obj)
  && typeof obj?.isFavorite === 'boolean'
  && typeof obj?.isQueued === 'boolean';

class Output {
  constructor({ sort, queuePage, start, totalCount, mediaOverviews, currentPageMediaOverviews, pageSize = DEFAULT_PAGE_SIZE } = {}) {
    if (!Object.values(INPUT_SORT_TYPES).includes(sort)) {
      throw new Error();
    }
    if (!Number.isInteger(queuePage) || queuePage <= 0) {
      throw new Error();
    }
    if (!Number.isInteger(start) || start <= 0) {
      throw new Error();
    }
    if (!Number.isInteger(totalCount) || totalCount < 0) {
      throw new Error();
    }
    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      throw new Error();
    }
    if (!(mediaOverviews instanceof Array) || !mediaOverviews.every(isMediaOverviewLike)) {
      throw new Error();
    }
    if (!(currentPageMediaOverviews instanceof Array) || !currentPageMediaOverviews.every(isDisplayMediaOverviewLike)) {
      throw new Error();
    }

    this.mediaOverviews = mediaOverviews;
    Object.defineProperties(this, {
      sort: { value: sort, enumerable: false },
      queuePage: { value: queuePage, enumerable: false },
      start: { value: start, enumerable: false },
      totalCount: { value: totalCount, enumerable: false },
      currentPageMediaOverviews: { value: currentPageMediaOverviews, enumerable: false },
      pageSize: { value: pageSize, enumerable: false },
    });
  }
}

const sortMediaOverviews = ({ sort, queueMediaIds, mediaOverviewMap, favoriteMediaIdSet }) => {
  const toDisplayOverview = mediaId => {
    const mediaOverview = mediaOverviewMap.get(mediaId);
    return Object.assign(
      Object.create(Object.getPrototypeOf(mediaOverview)),
      mediaOverview,
      {
        isFavorite: favoriteMediaIdSet.has(mediaId),
        isQueued: true,
      },
    );
  };

  if (sort === INPUT_SORT_TYPES.DATE_DESC) {
    return [...queueMediaIds].map(toDisplayOverview);
  }
  if (sort === INPUT_SORT_TYPES.DATE_ASC) {
    return [...queueMediaIds].reverse().map(toDisplayOverview);
  }

  const sorted = [...queueMediaIds].map(toDisplayOverview);
  sorted.sort((left, right) => {
    const compared = left.title.localeCompare(right.title, 'ja');
    return sort === INPUT_SORT_TYPES.TITLE_ASC ? compared : compared * -1;
  });
  return sorted;
};

class GetQueueService {
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
      return new Output({
        sort: input.sort,
        queuePage: input.queuePage,
        start: input.start,
        totalCount: 0,
        mediaOverviews: [],
        currentPageMediaOverviews: [],
      });
    }

    const queueMediaIds = user.getQueue().map(mediaId => mediaId.getId());
    if (queueMediaIds.length === 0) {
      return new Output({
        sort: input.sort,
        queuePage: input.queuePage,
        start: input.start,
        totalCount: 0,
        mediaOverviews: [],
        currentPageMediaOverviews: [],
      });
    }

    const mediaOverviews = await this.#mediaQueryRepository.findOverviewsByMediaIds(queueMediaIds);
    const mediaOverviewMap = new Map(mediaOverviews.map(media => [media.mediaId, media]));
    const favoriteMediaIdSet = new Set(user.getFavorites().map(mediaId => mediaId.getId()));
    const sortedMediaOverviews = sortMediaOverviews({
      sort: input.sort,
      queueMediaIds: queueMediaIds.filter(mediaId => mediaOverviewMap.has(mediaId)),
      mediaOverviewMap,
      favoriteMediaIdSet,
    });

    const currentPageMediaOverviews = sortedMediaOverviews.slice(input.start - 1, (input.start - 1) + input.pageSize);

    return new Output({
      sort: input.sort,
      queuePage: input.queuePage,
      start: input.start,
      totalCount: sortedMediaOverviews.length,
      mediaOverviews: currentPageMediaOverviews.map(({ isFavorite, isQueued, ...mediaOverview }) => mediaOverview),
      currentPageMediaOverviews,
    });
  }
}

module.exports = {
  Input,
  Output,
  GetQueueService,
  InputSortType: INPUT_SORT_TYPES,
  DEFAULT_PAGE_SIZE,
};
