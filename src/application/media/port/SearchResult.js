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
    if (!(tags instanceof Array) || !tags.every(tag => tag instanceof MediaOverviewTag)) {
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
    if (!(mediaOverviews instanceof Array) || !mediaOverviews.every(mov => mov instanceof MediaOverview)) {
      throw new Error();
    }
    if (typeof totalCount !== 'number' || totalCount < 0 || !Number.isInteger(totalCount)) {
      throw new Error();
    }

    this.mediaOverviews = mediaOverviews;
    this.totalCount = totalCount;
  }
}

module.exports = {
  SearchResult,
  MediaOverview,
  MediaOverviewTag,
};
