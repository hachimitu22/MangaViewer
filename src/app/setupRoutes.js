const express = require('express');

const setupRoutes = (app, { env: _env, dependencies } = {}) => {
  const router = express.Router();

  dependencies.routeSetters.setRouterScreenEntryGet({
    router,
    authResolver: dependencies.authResolver,
  });

  dependencies.routeSetters.setRouterApiMediaPost({
    router,
    authResolver: dependencies.authResolver,
    saveAdapter: dependencies.saveAdapter,
    mediaIdValueGenerator: dependencies.mediaIdValueGenerator,
    mediaRepository: dependencies.mediaRepository,
    unitOfWork: dependencies.unitOfWork,
  });

  app.use(router);

  app.use((_req, res) => {
    res.status(404).json({
      message: 'Not Found',
    });
  });
};

module.exports = setupRoutes;
