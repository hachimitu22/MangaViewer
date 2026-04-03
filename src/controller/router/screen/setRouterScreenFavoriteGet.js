const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const {
  Input,
  DEFAULT_SORT,
  SORT_TYPES,
  PAGE_SIZE,
} = require('../../../application/user/query/GetFavoriteSummariesService');

const SORT_OPTIONS = Object.freeze([
  { value: SORT_TYPES.DATE_ASC, label: '追加の新しい順' },
  { value: SORT_TYPES.DATE_DESC, label: '追加の古い順' },
  { value: SORT_TYPES.TITLE_ASC, label: 'タイトル名の昇順' },
  { value: SORT_TYPES.TITLE_DESC, label: 'タイトル名の降順' },
]);

const createPagination = ({ totalCount, page, pageSize }) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const items = [];
  for (let value = 1; value <= totalPages; value += 1) {
    items.push(value);
  }
  return { totalPages, currentPage, items };
};

const setRouterScreenFavoriteGet = ({ router, authResolver, getFavoriteSummariesService }) => {
  const auth = new SessionAuthMiddleware(authResolver);

  router.get('/screen/favorite', ...[
    auth.execute.bind(auth),
    async (req, res, next) => {
      const logger = req.app?.locals?.dependencies?.logger;
      try {
        const sort = typeof req.query.sort === 'string' && Object.values(SORT_TYPES).includes(req.query.sort)
          ? req.query.sort
          : DEFAULT_SORT;
        const page = Math.max(Number.parseInt(req.query.page ?? '1', 10) || 1, 1);
        const result = await getFavoriteSummariesService.execute(new Input({
          userId: req.context.userId,
          sort,
          page,
        }));
        const pagination = createPagination({
          totalCount: result.totalCount,
          page,
          pageSize: PAGE_SIZE,
        });

        res.status(200).render('screen/favorite', {
          pageTitle: 'お気に入り一覧',
          mediaOverviews: result.mediaOverviews,
          totalCount: result.totalCount,
          currentConditions: {
            sort,
            page: pagination.currentPage,
          },
          pagination,
          sortOptions: SORT_OPTIONS,
          currentPath: '/screen/favorite',
          currentUserId: req.context?.userId || null,
        });
      } catch (error) {
        logger?.error('screen.favorite.error', {
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

module.exports = setRouterScreenFavoriteGet;
module.exports.SORT_OPTIONS = SORT_OPTIONS;
module.exports.createPagination = createPagination;
