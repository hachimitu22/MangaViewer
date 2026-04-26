const express = require('express');

const setupRoutes = (app, { env = {}, dependencies } = {}) => {
  const router = express.Router();

  dependencies.routeSetters.setRouterRootGet({ router });
  dependencies.routeSetters.setRouterScreenEntryGet({ router });
  dependencies.routeSetters.setRouterScreenDetailGet({
    router,
    getMediaDetailService: dependencies.getMediaDetailService,
  });
  dependencies.routeSetters.setRouterScreenEditGet({
    router,
    getMediaDetailService: dependencies.getMediaDetailService,
  });
  dependencies.routeSetters.setRouterScreenErrorGet({ router });
  dependencies.routeSetters.setRouterScreenSearchGet({ router });
  dependencies.routeSetters.setRouterScreenSummaryGet({
    router,
    searchMediaService: dependencies.searchMediaService,
  });
  dependencies.routeSetters.setRouterScreenViewerGet({
    router,
    getMediaContentWithNavigationService: dependencies.getMediaContentWithNavigationService,
  });

  dependencies.routeSetters.setRouterApiMediaPost({
    router,
    saveAdapter: dependencies.saveAdapter,
    mediaIdValueGenerator: dependencies.mediaIdValueGenerator,
    mediaRepository: dependencies.mediaRepository,
    unitOfWork: dependencies.unitOfWork,
    allowedOrigin: env.appOrigin,
  });
  dependencies.routeSetters.setRouterApiMediaPatch({
    router,
    saveAdapter: dependencies.saveAdapter,
    updateMediaService: dependencies.updateMediaService,
    allowedOrigin: env.appOrigin,
  });
  dependencies.routeSetters.setRouterApiMediaDelete({
    router,
    deleteMediaService: dependencies.deleteMediaService,
    allowedOrigin: env.appOrigin,
  });

  app.use(router);

  app.use((_req, res) => res.status(404).json({ message: 'Not Found' }));
  app.use((error, _req, res, _next) => {
    dependencies.logger?.error('http.request.error', { message: error?.message, error });
    res.status(500).json({ message: 'Internal Server Error' });
  });
};

module.exports = setupRoutes;
