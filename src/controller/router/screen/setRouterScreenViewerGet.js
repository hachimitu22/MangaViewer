const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const ScreenViewerGetController = require('../../screen/ScreenViewerGetController');

const setRouterScreenViewerGet = ({ router, authResolver, getMediaContentWithNavigationService }) => {
  const auth = new SessionAuthMiddleware(authResolver);
  const controller = new ScreenViewerGetController({ getMediaContentWithNavigationService });

  router.get('/screen/viewer/:mediaId/:mediaPage', ...[
    auth.execute.bind(auth),
    controller.execute.bind(controller),
  ]);
};

module.exports = setRouterScreenViewerGet;
