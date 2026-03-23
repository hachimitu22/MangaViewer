const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');

const DEFAULT_SUMMARY_PAGE = 1;
const DEFAULT_START = 1;
const DEFAULT_SIZE = 20;

const setRouterScreenSearchGet = ({
  router,
  authResolver,
}) => {
  const auth = new SessionAuthMiddleware(authResolver);

  router.get('/screen/search', ...[
    auth.execute.bind(auth),
    (_req, res) => {
      res.status(200).render('screen/search', {
        pageTitle: 'メディア検索',
        summaryPage: DEFAULT_SUMMARY_PAGE,
        start: DEFAULT_START,
        size: DEFAULT_SIZE,
        categoryOptions: ['作者', 'ジャンル', 'シリーズ'],
        tagsByCategory: {
          作者: ['山田', '佐藤', '鈴木'],
          ジャンル: ['バトル', '恋愛', '日常'],
          シリーズ: ['第1部', '短編集'],
        },
        sortOptions: [
          { value: 'date_asc', label: '登録の新しい順' },
          { value: 'date_desc', label: '登録の古い順' },
          { value: 'title_asc', label: 'タイトル名の昇順' },
          { value: 'title_desc', label: 'タイトル名の降順' },
          { value: 'random', label: 'ランダム' },
        ],
      });
    },
  ]);
};

module.exports = setRouterScreenSearchGet;
module.exports.DEFAULT_SUMMARY_PAGE = DEFAULT_SUMMARY_PAGE;
module.exports.DEFAULT_START = DEFAULT_START;
module.exports.DEFAULT_SIZE = DEFAULT_SIZE;
