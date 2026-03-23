const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const ContentSaveMiddleware = require('../../middleware/ContentSaveMiddleware');
const MediaPatchController = require('../../api/MediaPatchController');

const setRouterApiMediaPatch = ({
  router,
  authResolver,
  saveAdapter,
  updateMediaService,
}) => {
  const auth = new SessionAuthMiddleware(authResolver);
  const save = new ContentSaveMiddleware({
    contentUploadAdapter: saveAdapter,
  });
  const controller = new MediaPatchController({
    updateMediaService,
  });

  router.patch('/api/media/:mediaId', ...[
    auth.execute.bind(auth),
    save.execute.bind(save),
    controller.execute.bind(controller),
  ]);
};

module.exports = setRouterApiMediaPatch;
