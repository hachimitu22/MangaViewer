const AdminTokenAuthMiddleware = require('../../middleware/AdminTokenAuthMiddleware');
const CsrfProtectionMiddleware = require('../../middleware/CsrfProtectionMiddleware');
const MediaDeleteController = require('../../api/MediaDeleteController');

const setRouterApiMediaDelete = ({
  router,
  adminApiToken,
  deleteMediaService,
  allowedOrigin,
}) => {
  const auth = new AdminTokenAuthMiddleware({ expectedToken: adminApiToken });
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
