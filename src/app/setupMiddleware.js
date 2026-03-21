const path = require('path');
const express = require('express');

const setupMiddleware = (app, { env: _env, dependencies: _dependencies } = {}) => {
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
    }

    next();
  });
};

module.exports = setupMiddleware;
