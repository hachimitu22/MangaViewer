const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const {
  Input,
  InputSortType,
  DEFAULT_PAGE_SIZE,
} = require('../../../application/user/query/GetQueueService');

const SORT_TYPES_BY_QUERY = Object.freeze({
  date_desc: InputSortType.DATE_DESC,
  date_asc: InputSortType.DATE_ASC,
  title_asc: InputSortType.TITLE_ASC,
  title_desc: InputSortType.TITLE_DESC,
});

const createPagination = ({ totalCount, queuePage, pageSize }) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(queuePage, 1), totalPages);
  const items = [];

  for (let page = 1; page <= totalPages; page += 1) {
    items.push(page);
  }

  return { totalPages, currentPage, items };
};

const setRouterScreenQueueGet = ({ router, authResolver, getQueueService }) => {
  const auth = new SessionAuthMiddleware(authResolver);

  router.get('/screen/queue', ...[
    auth.execute.bind(auth),
    async (req, res, next) => {
      try {
        const queuePage = Math.max(Number.parseInt(req.query.queuePage ?? '1', 10) || 1, 1);
        const sort = typeof req.query.sort === 'string' && SORT_TYPES_BY_QUERY[req.query.sort]
          ? req.query.sort
          : 'date_desc';

        const result = await getQueueService.execute(new Input({
          userId: req.context.userId,
          sort: SORT_TYPES_BY_QUERY[sort],
          queuePage,
        }));

        const pagination = createPagination({
          totalCount: result.totalCount,
          queuePage: result.queuePage,
          pageSize: DEFAULT_PAGE_SIZE,
        });

        res.status(200).render('screen/queue', {
          pageTitle: 'あとで見る一覧',
          mediaOverviews: result.mediaOverviews,
          currentConditions: {
            sort: result.sort,
            queuePage: pagination.currentPage,
          },
          totalCount: result.totalCount,
          pagination,
          sortOptions: [
            { value: 'date_desc', label: '登録の新しい順' },
            { value: 'date_asc', label: '登録の古い順' },
            { value: 'title_asc', label: 'タイトル名の昇順' },
            { value: 'title_desc', label: 'タイトル名の降順' },
          ],
        });
      } catch (error) {
        next(error);
      }
    },
  ]);
};

module.exports = setRouterScreenQueueGet;
module.exports.SORT_TYPES_BY_QUERY = SORT_TYPES_BY_QUERY;
module.exports.createPagination = createPagination;
