const CsrfProtectionMiddleware = require('../../middleware/CsrfProtectionMiddleware');
const MediaDeleteController = require('../../api/MediaDeleteController');

const setRouterApiMediaDelete = ({ router, deleteMediaService, allowedOrigin }) => {
  const csrf = new CsrfProtectionMiddleware({ allowedOrigin });
  const controller = new MediaDeleteController({ deleteMediaService });
  router.delete('/api/media/:mediaId', csrf.execute.bind(csrf), controller.execute.bind(controller));
};

module.exports = setRouterApiMediaDelete;
