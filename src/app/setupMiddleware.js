const path = require('path');
const express = require('express');

const { shouldApplyDevelopmentSession } = require('./developmentSession');

const parseCookieHeader = cookieHeader => {
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex <= 0) {
        return cookies;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      if (key.length === 0) {
        return cookies;
      }

      cookies[key] = value;
      return cookies;
    }, {});
};

const attachSessionHelpers = req => {
  req.session = req.session ?? {};
  req.session.req = req;
  req.session.regenerate = callback => {
    req.session = {};
    attachSessionHelpers(req);
    callback(null);
  };
  req.session.destroy = callback => {
    req.session = {};
    attachSessionHelpers(req);
    callback(null);
  };
};

const setupMiddleware = (app, { env = {}, dependencies: _dependencies } = {}) => {
  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'ejs');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, _res, next) => {
    req.context = req.context ?? {};
    attachSessionHelpers(req);

    const sessionToken = req.header('x-session-token');
    const cookies = parseCookieHeader(req.header('cookie'));
    if (typeof sessionToken === 'string' && sessionToken.length > 0) {
      req.session.session_token = sessionToken;
    } else if (typeof cookies.session_token === 'string' && cookies.session_token.length > 0) {
      req.session.session_token = cookies.session_token;
    } else if (shouldApplyDevelopmentSession({ env, requestPath: req.path })) {
      req.session.session_token = env.devSessionToken;
    }

    next();
  });
};

module.exports = setupMiddleware;
