const ScreenViewerGetController = require('../../screen/ScreenViewerGetController');

const setRouterScreenViewerGet = ({ router, getMediaContentWithNavigationService }) => {
  const controller = new ScreenViewerGetController({ getMediaContentWithNavigationService });

  router.get('/screen/viewer/:mediaId/:mediaPage', controller.execute.bind(controller));
};

module.exports = setRouterScreenViewerGet;
