const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { ALLOWED_CONTENT_EXTENSIONS } = require('../shared/contentMimeTypes');

const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

const resolveCsrfCookiePolicy = env => {
  const nodeEnv = String(env.nodeEnv || process.env.NODE_ENV || '').toLowerCase();
  const isProduction = nodeEnv === 'production';
  return { secure: isProduction, sameSite: isProduction ? 'strict' : 'lax' };
};

const createContentSecurityPolicy = ({ nonce }) => [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const validateContentStaticPath = (req, res, next) => {
  const extension = path.extname(req.path || '').toLowerCase();
  if (ALLOWED_CONTENT_EXTENSIONS.has(extension)) return next();
  return res.status(404).end();
};

const applyContentStaticHeaders = res => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
};

const setupMiddleware = (app, { env = {} } = {}) => {
  app.locals = app.locals ?? {};
  if (typeof app.locals.env === 'undefined') app.locals.env = env;

  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'ejs');
  if (typeof env.contentRootDirectory === 'string' && env.contentRootDirectory.length > 0) {
    app.use('/contents', validateContentStaticPath, express.static(env.contentRootDirectory, { setHeaders: applyContentStaticHeaders }));
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    req.context = req.context ?? {};
    req.state = req.state ?? {};

    const securityNonce = crypto.randomBytes(16).toString('base64');
    req.context.cspNonce = securityNonce;
    res.locals = res.locals ?? {};
    res.locals.cspNonce = securityNonce;
    res.setHeader('Content-Security-Policy', createContentSecurityPolicy({ nonce: securityNonce }));

    if (typeof req.state.csrf_token !== 'string' || req.state.csrf_token.length === 0) {
      req.state.csrf_token = createCsrfToken();
      const policy = resolveCsrfCookiePolicy(env);
      res.cookie?.('csrf_token', req.state.csrf_token, { httpOnly: false, path: '/', secure: policy.secure, sameSite: policy.sameSite });
    }
    res.locals.csrfToken = req.state.csrf_token;
    next();
  });
};

module.exports = setupMiddleware;
