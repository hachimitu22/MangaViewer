const express = require('express');

const setupRoutes = (app, { env: _env, dependencies } = {}) => {
  const router = express.Router();

  dependencies.routeSetters.setRouterScreenEntryGet({
    router,
    authResolver: dependencies.authResolver,
  });
  dependencies.routeSetters.setRouterScreenDetailGet({
    router,
    authResolver: dependencies.authResolver,
    getMediaDetailService: dependencies.getMediaDetailService,
  });
  dependencies.routeSetters.setRouterScreenEditGet({
    router,
    authResolver: dependencies.authResolver,
    getMediaDetailService: dependencies.getMediaDetailService,
  });

  dependencies.routeSetters.setRouterScreenErrorGet({
    router,
  });
  dependencies.routeSetters.setRouterScreenFavoriteGet({
    router,
    authResolver: dependencies.authResolver,
    getFavoriteSummariesService: dependencies.getFavoriteSummariesService,
  });
  dependencies.routeSetters.setRouterScreenLoginGet({
    router,
  });
  dependencies.routeSetters.setRouterScreenSearchGet({
    router,
    authResolver: dependencies.authResolver,
  });
  dependencies.routeSetters.setRouterScreenSummaryGet({
    router,
    authResolver: dependencies.authResolver,
    searchMediaService: dependencies.searchMediaService,
  });

  dependencies.routeSetters.setRouterApiMediaPost({
    router,
    authResolver: dependencies.authResolver,
    saveAdapter: dependencies.saveAdapter,
    mediaIdValueGenerator: dependencies.mediaIdValueGenerator,
    mediaRepository: dependencies.mediaRepository,
    unitOfWork: dependencies.unitOfWork,
  });
  dependencies.routeSetters.setRouterApiFavoriteAndQueue({
    router,
    authResolver: dependencies.authResolver,
    addFavoriteService: dependencies.addFavoriteService,
    removeFavoriteService: dependencies.removeFavoriteService,
    addQueueService: dependencies.addQueueService,
    removeQueueService: dependencies.removeQueueService,
  });

  app.use(router);

  app.use((_req, res) => {
    res.status(404).json({
      message: 'Not Found',
    });
  });
};

module.exports = setupRoutes;
