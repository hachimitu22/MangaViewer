const express = require('express');

const setupRoutes = (app, { env = {}, dependencies } = {}) => {
  const router = express.Router();

  dependencies.routeSetters.setRouterRootGet({
    router,
    authResolver: dependencies.authResolver,
  });
  dependencies.routeSetters.setRouterScreenEntryGet({
    router,
    authResolver: dependencies.authResolver,
  });
  dependencies.routeSetters.setRouterScreenDetailGet({
    router,
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
  dependencies.routeSetters.setRouterScreenSearchGet({
    router,
  });
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
    adminApiToken: env.adminApiToken,
    saveAdapter: dependencies.saveAdapter,
    mediaIdValueGenerator: dependencies.mediaIdValueGenerator,
    mediaRepository: dependencies.mediaRepository,
    unitOfWork: dependencies.unitOfWork,
    allowedOrigin: env.appOrigin,
  });
  dependencies.routeSetters.setRouterApiMediaPatch({
    router,
    adminApiToken: env.adminApiToken,
    saveAdapter: dependencies.saveAdapter,
    updateMediaService: dependencies.updateMediaService,
    allowedOrigin: env.appOrigin,
  });
  dependencies.routeSetters.setRouterApiMediaDelete({
    router,
    adminApiToken: env.adminApiToken,
    deleteMediaService: dependencies.deleteMediaService,
    allowedOrigin: env.appOrigin,
  });
  app.use(router);

  app.use((_req, res) => {
    res.status(404).json({
      message: 'Not Found',
    });
  });

  app.use((error, req, res, _next) => {
    dependencies.logger?.error('http.request.error', {
      request_id: req.context?.requestId,
      method: req.method,
      path: req.originalUrl,
      actor: 'admin/system',
      message: error?.message,
      error,
    });
    res.status(500).json({
      message: 'Internal Server Error',
    });
  });
};

module.exports = setupRoutes;
