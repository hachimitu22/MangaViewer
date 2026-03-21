const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');

const setRouterScreenEntryGet = ({
  router,
  authResolver,
}) => {
  const auth = new SessionAuthMiddleware(authResolver);

  router.get('/screen/entry', ...[
    auth.execute.bind(auth),
    (_req, res) => {
      res.status(200).render('screen/entry', {
        pageTitle: 'メディア登録',
        categoryOptions: ['作者', 'ジャンル', 'シリーズ'],
        tagsByCategory: {
          作者: ['山田', '佐藤', '鈴木'],
          ジャンル: ['バトル', '恋愛', '日常'],
          シリーズ: ['第1部', '短編集'],
        },
      });
    },
  ]);
};

module.exports = setRouterScreenEntryGet;
