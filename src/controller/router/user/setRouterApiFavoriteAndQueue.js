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

  router.put('/api/favorite/:mediaId', auth.execute.bind(auth), async (req, res, next) => {
    const logger = req.app?.locals?.dependencies?.logger;
    try {
      await addFavoriteService.execute(new AddFavoriteQuery({ mediaId: req.params.mediaId, userId: getUserId(req) }));
      logger?.info('favorite.added', {
        request_id: req.context?.requestId,
        user_id: getUserId(req),
        target_id: req.params.mediaId,
      });
      res.status(200).json({ code: 0 });
    } catch (error) {
      logger?.error('favorite.add.error', {
        request_id: req.context?.requestId,
        user_id: getUserId(req),
        target_id: req.params.mediaId,
        message: error?.message,
        error,
      });
      next(error);
    }
  });

  router.delete('/api/favorite/:mediaId', auth.execute.bind(auth), async (req, res, next) => {
    const logger = req.app?.locals?.dependencies?.logger;
    try {
      await removeFavoriteService.execute(new RemoveFavoriteQuery({ mediaId: req.params.mediaId, userId: getUserId(req) }));
      logger?.info('favorite.removed', {
        request_id: req.context?.requestId,
        user_id: getUserId(req),
        target_id: req.params.mediaId,
      });
      res.status(200).json({ code: 0 });
    } catch (error) {
      logger?.error('favorite.remove.error', {
        request_id: req.context?.requestId,
        user_id: getUserId(req),
        target_id: req.params.mediaId,
        message: error?.message,
        error,
      });
      next(error);
    }
  });

  router.put('/api/queue/:mediaId', auth.execute.bind(auth), async (req, res, next) => {
    const logger = req.app?.locals?.dependencies?.logger;
    try {
      await addQueueService.execute(new AddQueueQuery({ mediaId: req.params.mediaId, userId: getUserId(req) }));
      logger?.info('queue.added', {
        request_id: req.context?.requestId,
        user_id: getUserId(req),
        target_id: req.params.mediaId,
      });
      res.status(200).json({ code: 0 });
    } catch (error) {
      logger?.error('queue.add.error', {
        request_id: req.context?.requestId,
        user_id: getUserId(req),
        target_id: req.params.mediaId,
        message: error?.message,
        error,
      });
      next(error);
    }
  });

  router.delete('/api/queue/:mediaId', auth.execute.bind(auth), async (req, res, next) => {
    const logger = req.app?.locals?.dependencies?.logger;
    try {
      await removeQueueService.execute(new RemoveQueueQuery({ mediaId: req.params.mediaId, userId: getUserId(req) }));
      logger?.info('queue.removed', {
        request_id: req.context?.requestId,
        user_id: getUserId(req),
        target_id: req.params.mediaId,
      });
      res.status(200).json({ code: 0 });
    } catch (error) {
      logger?.error('queue.remove.error', {
        request_id: req.context?.requestId,
        user_id: getUserId(req),
        target_id: req.params.mediaId,
        message: error?.message,
        error,
      });
      next(error);
    }
  });
};

module.exports = setRouterApiFavoriteAndQueue;
