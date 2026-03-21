const path = require('path');
const express = require('express');

const { shouldApplyDevelopmentSession } = require('./developmentSession');

const setupMiddleware = (app, { env = {}, dependencies: _dependencies } = {}) => {
  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'ejs');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, _res, next) => {
    req.context = req.context ?? {};
    req.session = req.session ?? {};

    const sessionToken = req.header('x-session-token');
    if (typeof sessionToken === 'string' && sessionToken.length > 0) {
      req.session.session_token = sessionToken;
    } else if (shouldApplyDevelopmentSession({ env, requestPath: req.path })) {
      req.session.session_token = env.devSessionToken;
    }

    next();
  });
};

module.exports = setupMiddleware;
