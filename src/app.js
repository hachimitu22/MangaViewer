const express = require('express');

const createDependencies = require('./app/createDependencies');
const setupMiddleware = require('./app/setupMiddleware');
const setupRoutes = require('./app/setupRoutes');

const createApp = (env = {}) => {
  const app = express();
  const dependencies = createDependencies(env);

  app.locals.env = env;
  app.locals.dependencies = dependencies;
  app.locals.ready = dependencies.ready;

  setupMiddleware(app, { env, dependencies });
  setupRoutes(app, { env, dependencies });

  return app;
};

module.exports = createApp;
