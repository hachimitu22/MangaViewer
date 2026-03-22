const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const { Input } = require('../../../application/media/query/GetMediaDetailService');

const setRouterScreenEditGet = ({ router, authResolver, getMediaDetailService }) => {
  const auth = new SessionAuthMiddleware(authResolver);

  router.get('/screen/edit/:mediaId', ...[
    auth.execute.bind(auth),
    async (req, res, next) => {
      try {
        const result = await getMediaDetailService.execute(new Input({
          id: req.params.mediaId,
        }));

        res.status(200).render('screen/edit', {
          pageTitle: `${result.mediaDetail.title} の編集`,
          mediaDetail: result.mediaDetail,
          categoryOptions: ['作者', 'ジャンル', 'シリーズ'],
          tagsByCategory: {
            作者: ['山田', '佐藤', '鈴木'],
            ジャンル: ['バトル', '恋愛', '日常'],
            シリーズ: ['第1部', '短編集'],
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ]);
};

module.exports = setRouterScreenEditGet;
