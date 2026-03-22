const { Op } = require('sequelize');

const IMediaQueryRepository = require('../application/media/port/IMediaQueryRepository');
const { SearchCondition, SortType } = require('../application/media/port/SearchCondition');
const {
  SearchResult,
  MediaOverview,
  MediaOverviewTag,
} = require('../application/media/port/SearchResult');
const { defineModels } = require('./SequelizeMediaRepository');


const extractMediaIdValue = mediaId => {
  if (typeof mediaId === 'string') {
    return mediaId;
  }
  if (mediaId && typeof mediaId.get === 'function') {
    const value = mediaId.get('media_id');
    if (typeof value === 'string') {
      return value;
    }
  }
  if (typeof mediaId?.media_id === 'string') {
    return mediaId.media_id;
  }
  return null;
};

const buildSortOrder = (sortType) => {
  switch (sortType) {
    case SortType.DATE_ASC:
      return [['createdAtProxy', 'DESC'], ['media_id', 'ASC']];
    case SortType.DATE_DESC:
      return [['createdAtProxy', 'ASC'], ['media_id', 'ASC']];
    case SortType.TITLE_ASC:
      return [['title', 'ASC'], ['media_id', 'ASC']];
    case SortType.TITLE_DESC:
      return [['title', 'DESC'], ['media_id', 'ASC']];
    case SortType.RANDOM:
      return null;
    default:
      throw new Error();
  }
};

module.exports = class SequelizeMediaQueryRepository extends IMediaQueryRepository {
  #models;

  constructor({ sequelize, models } = {}) {
    super();

    if (!sequelize || typeof sequelize.random !== 'function') {
      throw new Error();
    }

    this.sequelize = sequelize;
    this.#models = models || defineModels(sequelize);
  }

  async search(condition) {
    if (!(condition instanceof SearchCondition)) {
      throw new Error();
    }

    const { MediaModel, CategoryModel, TagModel, MediaTagModel } = this.#models;

    const mediaIds = await this.#findMatchedMediaIds({
      condition,
      MediaModel,
      CategoryModel,
      TagModel,
      MediaTagModel,
    });

    if (mediaIds.length === 0) {
      return new SearchResult({ mediaOverviews: [], totalCount: 0 });
    }

    const totalCount = mediaIds.length;
    const pagedIds = await this.#paginateMediaIds({
      mediaIds,
      condition,
      MediaModel,
    });

    if (pagedIds.length === 0) {
      return new SearchResult({ mediaOverviews: [], totalCount });
    }

    const mediaOverviews = await this.findOverviewsByMediaIds(pagedIds);
    return new SearchResult({ mediaOverviews, totalCount });
  }

  async findOverviewsByMediaIds(mediaIds) {
    if (!Array.isArray(mediaIds)) {
      throw new Error();
    }

    const normalizedMediaIds = mediaIds
      .map(extractMediaIdValue)
      .filter(mediaId => typeof mediaId === 'string');

    if (normalizedMediaIds.length !== mediaIds.length) {
      throw new Error();
    }
    if (normalizedMediaIds.length === 0) {
      return [];
    }

    const { MediaModel, ContentModel, TagModel, CategoryModel, MediaTagModel, MediaCategoryModel } = this.#models;
    const [contentRows, tagRows, categoryRows, mediaRows] = await Promise.all([
      ContentModel.findAll({
        where: { media_id: normalizedMediaIds },
        order: [['media_id', 'ASC'], ['position', 'ASC']],
      }),
      MediaTagModel.findAll({
        where: { media_id: normalizedMediaIds },
        include: [{
          model: TagModel,
          as: 'tag',
          include: [{ model: CategoryModel, as: 'category' }],
        }],
      }),
      MediaCategoryModel.findAll({
        where: { media_id: normalizedMediaIds },
        include: [{ model: CategoryModel, as: 'category' }],
        order: [['media_id', 'ASC'], ['priority', 'ASC']],
      }),
      MediaModel.findAll({ where: { media_id: normalizedMediaIds } }),
    ]);

    const mediaRowMap = new Map(mediaRows.map(row => [row.media_id, row]));
    const thumbnailMap = new Map();
    contentRows.forEach(row => {
      if (!thumbnailMap.has(row.media_id)) {
        thumbnailMap.set(row.media_id, row.content_id);
      }
    });

    const tagsMap = new Map();
    tagRows.forEach(row => {
      const items = tagsMap.get(row.media_id) ?? [];
      items.push(new MediaOverviewTag({
        category: row.tag.category.name,
        label: row.tag.name,
      }));
      tagsMap.set(row.media_id, items);
    });

    const priorityCategoriesMap = new Map();
    categoryRows.forEach(row => {
      const items = priorityCategoriesMap.get(row.media_id) ?? [];
      items.push(row.category.name);
      priorityCategoriesMap.set(row.media_id, items);
    });

    return normalizedMediaIds
      .map(mediaId => mediaRowMap.get(mediaId))
      .filter(Boolean)
      .map(row => new MediaOverview({
        mediaId: row.media_id,
        title: row.title,
        thumbnail: thumbnailMap.get(row.media_id) ?? '',
        tags: this.#sortTags({
          tags: tagsMap.get(row.media_id) ?? [],
          priorityCategories: priorityCategoriesMap.get(row.media_id) ?? [],
        }),
        priorityCategories: priorityCategoriesMap.get(row.media_id) ?? [],
      }));
  }

  #sortTags({ tags, priorityCategories }) {
    const priorityMap = new Map(priorityCategories.map((category, index) => [category, index]));

    return [...tags].sort((a, b) => {
      const aPriority = priorityMap.has(a.category) ? priorityMap.get(a.category) : Number.MAX_SAFE_INTEGER;
      const bPriority = priorityMap.has(b.category) ? priorityMap.get(b.category) : Number.MAX_SAFE_INTEGER;
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category, 'ja');
      }
      return a.label.localeCompare(b.label, 'ja');
    });
  }

  async #findMatchedMediaIds({ condition, MediaModel, CategoryModel, TagModel, MediaTagModel }) {
    const where = {};
    if (condition.title.length > 0) {
      where.title = { [Op.like]: `%${condition.title}%` };
    }

    const mediaRows = await MediaModel.findAll({
      where,
      attributes: ['media_id'],
    });
    let matchedMediaIds = mediaRows.map(row => row.media_id);

    for (const tag of condition.tags) {
      if (matchedMediaIds.length === 0) {
        return [];
      }

      const categoryRow = await CategoryModel.findOne({ where: { name: tag.category } });
      if (!categoryRow) {
        return [];
      }

      const tagRow = await TagModel.findOne({
        where: {
          category_id: categoryRow.category_id,
          name: tag.label,
        },
      });
      if (!tagRow) {
        return [];
      }

      const mediaTagRows = await MediaTagModel.findAll({
        where: {
          media_id: matchedMediaIds,
          tag_id: tagRow.tag_id,
        },
        attributes: ['media_id'],
      });

      matchedMediaIds = mediaTagRows.map(row => row.media_id);
    }

    return matchedMediaIds;
  }

  async #paginateMediaIds({ mediaIds, condition, MediaModel }) {
    const order = buildSortOrder(condition.sortType);
    const query = {
      where: { media_id: mediaIds },
      attributes: [
        'media_id',
        [this.sequelize.literal('rowid'), 'createdAtProxy'],
      ],
      offset: condition.start - 1,
      limit: condition.size,
    };

    if (order) {
      query.order = order;
    } else {
      query.order = this.sequelize.random();
    }

    const rows = await MediaModel.findAll(query);
    return rows.map(row => extractMediaIdValue(row));
  }
};
