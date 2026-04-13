const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const CsrfProtectionMiddleware = require('../../middleware/CsrfProtectionMiddleware');
const MediaDeleteController = require('../../api/MediaDeleteController');

const setRouterApiMediaDelete = ({
  router,
  authResolver,
  deleteMediaService,
  allowedOrigin,
}) => {
  const auth = new SessionAuthMiddleware(authResolver);
  const csrf = new CsrfProtectionMiddleware({ allowedOrigin });
  const controller = new MediaDeleteController({
    deleteMediaService,
  });

  router.delete('/api/media/:mediaId', ...[
    auth.execute.bind(auth),
    csrf.execute.bind(csrf),
    controller.execute.bind(controller),
  ]);
};

module.exports = setRouterApiMediaDelete;
