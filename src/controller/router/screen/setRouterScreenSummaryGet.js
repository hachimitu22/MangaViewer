const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const {
  Input,
  InputSortType,
} = require('../../../application/media/query/SearchMediaService');
const { mapMediaOverviewThumbnailToPublicPath } = require('../../screen/publicContentPath');
const {
  DEFAULT_SUMMARY_PAGE,
  DEFAULT_START,
  DEFAULT_SIZE,
} = require('./setRouterScreenSearchGet');

const SORT_TYPES_BY_QUERY = Object.freeze({
  date_asc: InputSortType.DATE_ASC,
  date_desc: InputSortType.DATE_DESC,
  title_asc: InputSortType.TITLE_ASC,
  title_desc: InputSortType.TITLE_DESC,
  random: InputSortType.RANDOM,
});

const normalizeTags = (rawTags) => {
  const values = rawTags === undefined ? [] : (Array.isArray(rawTags) ? rawTags : [rawTags]);

  return values
    .filter(value => typeof value === 'string')
    .map(value => value.trim())
    .filter(value => value.length > 0)
    .map(value => {
      const separatorIndex = value.indexOf(':');
      if (separatorIndex <= 0 || separatorIndex >= value.length - 1) {
        return null;
      }

      return {
        category: value.slice(0, separatorIndex).trim(),
        label: value.slice(separatorIndex + 1).trim(),
      };
    })
    .filter(tag => tag && tag.category.length > 0 && tag.label.length > 0);
};

const normalizePositiveInteger = (value, fallback) => {
  const normalized = Number.parseInt(value ?? '', 10);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return fallback;
  }

  return normalized;
};

const normalizeSearchRange = ({ summaryPage, start, size }) => {
  const normalizedSize = normalizePositiveInteger(size, DEFAULT_SIZE);
  const normalizedStart = normalizePositiveInteger(start, null);

  if (normalizedStart !== null) {
    return {
      summaryPage: Math.floor((normalizedStart - 1) / normalizedSize) + 1,
      start: normalizedStart,
      size: normalizedSize,
    };
  }

  const normalizedSummaryPage = normalizePositiveInteger(summaryPage, DEFAULT_SUMMARY_PAGE);
  return {
    summaryPage: normalizedSummaryPage,
    start: ((normalizedSummaryPage - 1) * normalizedSize) + 1,
    size: normalizedSize,
  };
};

const createPagination = ({ totalCount, summaryPage, pageSize }) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(summaryPage, 1), totalPages);
  const pages = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const isEdge = page === 1 || page === totalPages;
    const isNearCurrent = Math.abs(page - currentPage) <= 1;
    if (isEdge || isNearCurrent || totalPages <= 7) {
      pages.push(page);
    }
  }

  const items = [];
  pages.forEach(page => {
    if (items.length > 0 && page - items[items.length - 1] > 1) {
      items.push('ellipsis');
    }
    items.push(page);
  });

  return { totalPages, currentPage, items };
};

const setRouterScreenSummaryGet = ({ router, authResolver, searchMediaService }) => {
  const auth = new SessionAuthMiddleware(authResolver);

  router.get('/screen/summary', ...[
    auth.execute.bind(auth),
    async (req, res, next) => {
      const logger = req.app?.locals?.dependencies?.logger;
      try {
        const range = normalizeSearchRange({
          summaryPage: req.query.summaryPage,
          start: req.query.start,
          size: req.query.size,
        });
        const title = typeof req.query.title === 'string' ? req.query.title : '';
        const tags = normalizeTags(req.query.tags);
        const sort = typeof req.query.sort === 'string' && SORT_TYPES_BY_QUERY[req.query.sort]
          ? req.query.sort
          : 'date_asc';

        const result = await searchMediaService.execute(new Input({
          title,
          tags,
          sortType: SORT_TYPES_BY_QUERY[sort],
          start: range.start,
          size: range.size,
        }));

        const pagination = createPagination({
          totalCount: result.totalCount,
          summaryPage: range.summaryPage,
          pageSize: range.size,
        });
        const mediaOverviews = result.mediaOverviews
          .map(mapMediaOverviewThumbnailToPublicPath)
          .map(media => ({
            ...media,
            thumbnailFallbackLabel: 'NO IMAGE',
          }));

        res.status(200).render('screen/summary', {
          pageTitle: 'メディア一覧',
          currentConditions: {
            summaryPage: pagination.currentPage,
            title,
            tags,
            sort,
            start: range.start,
            size: range.size,
          },
          mediaOverviews,
          totalCount: result.totalCount,
          pagination,
          currentPath: '/screen/summary',
          currentUserId: req.context?.userId || null,
          sortOptions: [
            { value: 'date_desc', label: '登録の新しい順' },
            { value: 'date_asc', label: '登録の古い順' },
            { value: 'title_asc', label: 'タイトル名の昇順' },
            { value: 'title_desc', label: 'タイトル名の降順' },
            { value: 'random', label: 'ランダム' },
          ],
        });
      } catch (error) {
        logger?.error('screen.summary.error', {
          request_id: req.context?.requestId,
          user_id: req.context?.userId || 'anonymous',
          message: error?.message,
          error,
        });
        next(error);
      }
    },
  ]);
};

module.exports = setRouterScreenSummaryGet;
module.exports.SORT_TYPES_BY_QUERY = SORT_TYPES_BY_QUERY;
module.exports.normalizeTags = normalizeTags;
module.exports.normalizeSearchRange = normalizeSearchRange;
module.exports.createPagination = createPagination;
