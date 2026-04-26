const CsrfProtectionMiddleware = require('../../middleware/CsrfProtectionMiddleware');
const ContentSaveMiddleware = require('../../middleware/ContentSaveMiddleware');
const MediaPostController = require('../../api/MediaPostController');
const {
  RegisterMediaService,
} = require('../../../application/media/command/RegisterMediaService');

const setRouterApiMediaPost = ({
  router,
  saveAdapter,
  mediaIdValueGenerator,
  mediaRepository,
  unitOfWork,
  allowedOrigin,
}) => {
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
    csrf.execute.bind(csrf),
    save.execute.bind(save),
    controller.execute.bind(controller),
  ]);
};

module.exports = setRouterApiMediaPost;
