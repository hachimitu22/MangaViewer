const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const { Query: AddFavoriteQuery } = require('../../../application/user/command/AddFavoriteService');
const { Query: RemoveFavoriteQuery } = require('../../../application/user/command/RemoveFavoriteService');
const { Query: AddQueueQuery } = require('../../../application/user/command/AddQueueService');
const { Query: RemoveQueueQuery } = require('../../../application/user/command/RemoveQueueService');

const setRouterApiFavoriteAndQueue = ({
  router,
  authResolver,
  addFavoriteService,
  removeFavoriteService,
  addQueueService,
  removeQueueService,
}) => {
  const auth = new SessionAuthMiddleware(authResolver);
  const getUserId = req => req.context.userId;

  router.post('/api/favorite/:mediaId', auth.execute.bind(auth), async (req, res, next) => {
    try {
      await addFavoriteService.execute(new AddFavoriteQuery({ mediaId: req.params.mediaId, userId: getUserId(req) }));
      res.status(200).json({ code: 0 });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/api/favorite/:mediaId', auth.execute.bind(auth), async (req, res, next) => {
    try {
      await removeFavoriteService.execute(new RemoveFavoriteQuery({ mediaId: req.params.mediaId, userId: getUserId(req) }));
      res.status(200).json({ code: 0 });
    } catch (error) {
      next(error);
    }
  });

  router.put('/api/queue/:mediaId', auth.execute.bind(auth), async (req, res, next) => {
    try {
      await addQueueService.execute(new AddQueueQuery({ mediaId: req.params.mediaId, userId: getUserId(req) }));
      res.status(200).json({ code: 0 });
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/queue/:mediaId', auth.execute.bind(auth), async (req, res, next) => {
    try {
      await addQueueService.execute(new AddQueueQuery({ mediaId: req.params.mediaId, userId: getUserId(req) }));
      res.status(200).json({ code: 0 });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/api/queue/:mediaId', auth.execute.bind(auth), async (req, res, next) => {
    try {
      await removeQueueService.execute(new RemoveQueueQuery({ mediaId: req.params.mediaId, userId: getUserId(req) }));
      res.status(200).json({ code: 0 });
    } catch (error) {
      next(error);
    }
  });
};

module.exports = setRouterApiFavoriteAndQueue;
