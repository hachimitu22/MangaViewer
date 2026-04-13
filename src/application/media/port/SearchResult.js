const isMediaOverviewTagLike = tag => typeof tag?.category === 'string' && typeof tag?.label === 'string';

class MediaOverviewTag {
  constructor({ category, label }) {
    if (typeof category !== 'string') {
      throw new Error();
    }
    if (typeof label !== 'string') {
      throw new Error();
    }

    this.category = category;
    this.label = label;
  }
}

const isMediaOverviewLike = mediaOverview => typeof mediaOverview?.mediaId === 'string'
  && typeof mediaOverview?.title === 'string'
  && typeof mediaOverview?.thumbnail === 'string'
  && Array.isArray(mediaOverview?.tags)
  && mediaOverview.tags.every(isMediaOverviewTagLike)
  && Array.isArray(mediaOverview?.priorityCategories)
  && mediaOverview.priorityCategories.every(priorityCategory => typeof priorityCategory === 'string');

class MediaOverview {
  constructor({ mediaId, title, thumbnail, tags, priorityCategories }) {
    if (typeof mediaId !== 'string') {
      throw new Error();
    }
    if (typeof title !== 'string') {
      throw new Error();
    }
    if (typeof thumbnail !== 'string') {
      throw new Error();
    }
    if (!(tags instanceof Array) || !tags.every(isMediaOverviewTagLike)) {
      throw new Error();
    }
    if (!(priorityCategories instanceof Array) || !priorityCategories.every(pc => typeof pc === 'string')) {
      throw new Error();
    }

    this.mediaId = mediaId;
    this.title = title;
    this.thumbnail = thumbnail;
    this.tags = tags;
    this.priorityCategories = priorityCategories;
  }
}

class SearchResult {
  constructor({ mediaOverviews, totalCount }) {
    if (!Array.isArray(mediaOverviews) || !mediaOverviews.every(isMediaOverviewLike)) {
      throw new Error();
    }
    if (typeof totalCount !== 'number' || totalCount < 0 || !Number.isInteger(totalCount)) {
      throw new Error();
    }

    this.mediaOverviews = mediaOverviews.map(mediaOverview => new MediaOverview({
      ...mediaOverview,
      tags: mediaOverview.tags.map(tag => new MediaOverviewTag(tag)),
    }));
    this.totalCount = totalCount;
  }
}

module.exports = {
  SearchResult,
  MediaOverview,
  MediaOverviewTag,
};
