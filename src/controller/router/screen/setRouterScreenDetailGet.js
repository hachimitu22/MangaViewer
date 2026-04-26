const ScreenDetailGetController = require('../../screen/ScreenDetailGetController');

const setRouterScreenDetailGet = ({ router, getMediaDetailService }) => {
  const controller = new ScreenDetailGetController({ getMediaDetailService });

  router.get('/screen/detail/:mediaId', controller.execute.bind(controller));
};

module.exports = setRouterScreenDetailGet;
