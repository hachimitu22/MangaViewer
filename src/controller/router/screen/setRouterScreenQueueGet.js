const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const { Input } = require('../../../application/user/query/GetQueueService');

const setRouterScreenQueueGet = ({ router, authResolver, getQueueService }) => {
  const auth = new SessionAuthMiddleware(authResolver);

  router.get('/screen/queue', ...[
    auth.execute.bind(auth),
    async (req, res, next) => {
      try {
        const result = await getQueueService.execute(new Input({
          userId: req.context.userId,
        }));

        res.status(200).render('screen/queue', {
          pageTitle: 'あとで見る一覧',
          mediaOverviews: result.mediaOverviews,
        });
      } catch (error) {
        next(error);
      }
    },
  ]);
};

module.exports = setRouterScreenQueueGet;
