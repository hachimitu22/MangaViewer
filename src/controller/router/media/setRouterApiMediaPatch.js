const AdminTokenAuthMiddleware = require('../../middleware/AdminTokenAuthMiddleware');
const CsrfProtectionMiddleware = require('../../middleware/CsrfProtectionMiddleware');
const ContentSaveMiddleware = require('../../middleware/ContentSaveMiddleware');
const MediaPatchController = require('../../api/MediaPatchController');

const setRouterApiMediaPatch = ({
  router,
  adminApiToken,
  saveAdapter,
  updateMediaService,
  allowedOrigin,
}) => {
  const auth = new AdminTokenAuthMiddleware({ expectedToken: adminApiToken });
  const csrf = new CsrfProtectionMiddleware({ allowedOrigin });
  const save = new ContentSaveMiddleware({
    contentUploadAdapter: saveAdapter,
  });
  const controller = new MediaPatchController({
    updateMediaService,
  });

  router.patch('/api/media/:mediaId', ...[
    auth.execute.bind(auth),
    csrf.execute.bind(csrf),
    save.execute.bind(save),
    controller.execute.bind(controller),
  ]);
};

module.exports = setRouterApiMediaPatch;
