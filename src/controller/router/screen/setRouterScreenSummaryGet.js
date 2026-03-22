const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const {
  Input,
  InputSortType,
} = require('../../../application/media/query/SearchMediaService');
const { createContentPublicPath } = require('../../../presentation/content/contentAssetPaths');

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
      try {
        const summaryPage = Math.max(Number.parseInt(req.query.summaryPage ?? '1', 10) || 1, 1);
        const title = typeof req.query.title === 'string' ? req.query.title : '';
        const tags = normalizeTags(req.query.tags);
        const sort = typeof req.query.sort === 'string' && SORT_TYPES_BY_QUERY[req.query.sort]
          ? req.query.sort
          : 'date_asc';

        const result = await searchMediaService.execute(new Input({
          title,
          tags,
          sortType: SORT_TYPES_BY_QUERY[sort],
          start: ((summaryPage - 1) * 20) + 1,
        }));

        const pagination = createPagination({
          totalCount: result.totalCount,
          summaryPage,
          pageSize: 20,
        });

        res.status(200).render('screen/summary', {
          pageTitle: 'メディア一覧',
          currentConditions: {
            summaryPage: pagination.currentPage,
            title,
            tags,
            sort,
          },
          mediaOverviews: result.mediaOverviews.map(media => ({
            ...media,
            thumbnail: media.thumbnail ? createContentPublicPath(media.thumbnail) : '',
          })),
          totalCount: result.totalCount,
          pagination,
          sortOptions: [
            { value: 'date_asc', label: '登録の新しい順' },
            { value: 'date_desc', label: '登録の古い順' },
            { value: 'title_asc', label: 'タイトル名の昇順' },
            { value: 'title_desc', label: 'タイトル名の降順' },
            { value: 'random', label: 'ランダム' },
          ],
        });
      } catch (error) {
        next(error);
      }
    },
  ]);
};

module.exports = setRouterScreenSummaryGet;
module.exports.SORT_TYPES_BY_QUERY = SORT_TYPES_BY_QUERY;
module.exports.normalizeTags = normalizeTags;
module.exports.createPagination = createPagination;
