const AdminTokenAuthMiddleware = require('../../middleware/AdminTokenAuthMiddleware');
const CsrfProtectionMiddleware = require('../../middleware/CsrfProtectionMiddleware');
const ContentSaveMiddleware = require('../../middleware/ContentSaveMiddleware');
const MediaPostController = require('../../api/MediaPostController');
const {
  RegisterMediaService,
} = require('../../../application/media/command/RegisterMediaService');

const setRouterApiMediaPost = ({
  router,
  adminApiToken,
  saveAdapter,
  mediaIdValueGenerator,
  mediaRepository,
  unitOfWork,
  allowedOrigin,
}) => {
  const auth = new AdminTokenAuthMiddleware({ expectedToken: adminApiToken });
  const csrf = new CsrfProtectionMiddleware({ allowedOrigin });

  const save = new ContentSaveMiddleware({
    contentUploadAdapter: saveAdapter,
  });

  const application = new RegisterMediaService({
    mediaIdValueGenerator,
    mediaRepository,
    unitOfWork,
  });

  const controller = new MediaPostController({
    registerMediaService: application,
  });

  router.post('/api/media', ...[
    auth.execute.bind(auth),
    csrf.execute.bind(csrf),
    save.execute.bind(save),
    controller.execute.bind(controller),
  ]);
};

module.exports = setRouterApiMediaPost;
