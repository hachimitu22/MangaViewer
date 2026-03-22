const SessionAuthMiddleware = require('../../middleware/SessionAuthMiddleware');
const ScreenDetailGetController = require('../../screen/ScreenDetailGetController');

const setRouterScreenDetailGet = ({ router, authResolver, getMediaDetailService }) => {
  const auth = new SessionAuthMiddleware(authResolver);
  const controller = new ScreenDetailGetController({ getMediaDetailService });

  router.get('/screen/detail/:mediaId', ...[
    auth.execute.bind(auth),
    controller.execute.bind(controller),
  ]);
};

module.exports = setRouterScreenDetailGet;
