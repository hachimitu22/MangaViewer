const {
  SearchCondition,
  SearchConditionTag,
  SortType,
} = require('../port/SearchCondition');

const InputSortType = SortType;

// SearchCondition と同じなので継承だけで済ます
class Input {
  constructor({ title, tags, sortType, start }) {
    if (typeof title !== 'string') {
      throw new Error();
    }
    if (!(tags instanceof Array) || !tags.every(tag => ['category', 'label'].every(prop => prop in tag))) {
      throw new Error();
    }
    if (!Object.values(InputSortType).includes(sortType)) {
      throw new Error();
    }
    if (typeof start !== 'number' || start <= 0 || !Number.isInteger(start)) {
      throw new Error();
    }

    this.title = title;
    this.tags = tags;
    this.sortType = sortType;
    this.start = start;
  }
}

const isMediaOverviewLike = (obj) => {
  if (typeof obj.mediaId !== 'string') {
    return false;
  }
  if (typeof obj.title !== 'string') {
    return false;
  }
  if (typeof obj.thumbnail !== 'string') {
    return false;
  }
  if (!(obj.tags instanceof Array)) {
    return false;
  }
  if (!obj.tags.every(tag => ['category', 'label'].every(prop => prop in tag))) {
    return false;
  }
  if (!(obj.priorityCategories instanceof Array)) {
    return false;
  }
  if (!obj.priorityCategories.every(c => typeof c === 'string')) {
    return false;
  }
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

class SearchMediaService {
  #mediaQueryRepository;

  constructor({ mediaQueryRepository }) {
    if (!mediaQueryRepository || typeof mediaQueryRepository.search !== 'function') {
      throw new Error();
    }

    this.#mediaQueryRepository = mediaQueryRepository;
  }

  async execute(input) {
    if (!(input instanceof Input)) {
      throw new Error();
    }

    const condition = new SearchCondition({
      title: input.title,
      tags: input.tags.map(tag => new SearchConditionTag({ ...tag })),
      sortType: input.sortType,
      start: input.start,
      size: 20,
    });
    const searchResult = await this.#mediaQueryRepository.search(condition);

    const output = new Output({
      mediaOverviews: searchResult.mediaOverviews.map(mediaOverview => ({
        mediaId: mediaOverview.mediaId,
        title: mediaOverview.title,
        thumbnail: mediaOverview.thumbnail,
        tags: mediaOverview.tags.map(tag => ({
          category: tag.category,
          label: tag.label,
        })),
        priorityCategories: [...mediaOverview.priorityCategories],
      })),
      totalCount: searchResult.totalCount,
    });

    return output;
  }
}

module.exports = {
  Input,
  InputSortType,
  Output,
  SearchMediaService,
};
