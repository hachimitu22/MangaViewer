const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const MediaDeleteController = require('../../api/MediaDeleteController');

const setRouterApiMediaDelete = ({
  router,
  authResolver,
  deleteMediaService,
}) => {
  const auth = new SessionAuthMiddleware(authResolver);
  const controller = new MediaDeleteController({
    deleteMediaService,
  });

  router.delete('/api/media/:mediaId', ...[
    auth.execute.bind(auth),
    controller.execute.bind(controller),
  ]);
};

module.exports = setRouterApiMediaDelete;
