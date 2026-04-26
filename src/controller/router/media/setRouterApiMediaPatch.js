const CsrfProtectionMiddleware = require('../../middleware/CsrfProtectionMiddleware');
const ContentSaveMiddleware = require('../../middleware/ContentSaveMiddleware');
const MediaPatchController = require('../../api/MediaPatchController');

const setRouterApiMediaPatch = ({ router, saveAdapter, updateMediaService, allowedOrigin }) => {
  const csrf = new CsrfProtectionMiddleware({ allowedOrigin });
  const save = new ContentSaveMiddleware({ contentUploadAdapter: saveAdapter });
  const controller = new MediaPatchController({ updateMediaService });

  router.patch('/api/media/:mediaId', csrf.execute.bind(csrf), save.execute.bind(save), controller.execute.bind(controller));
};

module.exports = setRouterApiMediaPatch;
