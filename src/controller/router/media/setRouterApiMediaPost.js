const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const ContentSaveMiddleware = require('../../middleware/ContentSaveMiddleware');
const MediaPostController = require('../../api/MediaPostController');
const {
  RegisterMediaService,
} = require('../../../application/media/command/RegisterMediaService');

const setRouterApiMediaPost = ({
  router,
  authResolver,
  saveResolver,
  mediaIdGenerator,
  mediaRepository,
}) => {
  const auth = new SessionAuthMiddleware({
    resolveUserIdBySessionToken: authResolver.execute.bind(authResolver),
  });

  const save = new ContentSaveMiddleware({
    contentStorage: {
      save: saveResolver.execute.bind(saveResolver),
    },
  });

  const application = new RegisterMediaService({
    mediaIdValueGenerator: mediaIdGenerator,
    mediaRepository,
  });

  const controller = new MediaPostController({
    registerMediaService: application,
  });

  router.post('/api/media', ...[
    auth.execute.bind(auth),
    save.execute.bind(save),
    controller.execute.bind(controller),
  ]);
};

module.exports = setRouterApiMediaPost;
