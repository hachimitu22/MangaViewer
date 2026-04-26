const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { ALLOWED_CONTENT_EXTENSIONS } = require('../shared/contentMimeTypes');

const parseCookieHeader = cookieHeader => {
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) return {};
  return cookieHeader.split(';').map(v => v.trim()).filter(Boolean).reduce((acc, entry) => {
    const i = entry.indexOf('=');
    if (i <= 0) return acc;
    acc[entry.slice(0, i).trim()] = entry.slice(i + 1).trim();
    return acc;
  }, {});
};

const attachSessionHelpers = req => {
  req.session = req.session ?? {};
  req.session.req = req;
  req.session.regenerate = callback => callback(null);
  req.session.destroy = callback => callback(null);
};

const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

const resolveCsrfCookiePolicy = env => {
  const isProduction = String(env.nodeEnv || process.env.NODE_ENV || '').toLowerCase() === 'production';
  return { secure: isProduction, sameSite: isProduction ? 'strict' : 'lax' };
};

const createContentSecurityPolicy = ({ nonce }) => ([
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
].join('; '));

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
    attachSessionHelpers(req);
    const nonce = crypto.randomBytes(16).toString('base64');
    req.context.cspNonce = nonce;
    res.locals = res.locals ?? {};
    res.locals.cspNonce = nonce;
    res.setHeader('Content-Security-Policy', createContentSecurityPolicy({ nonce }));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');

    const cookies = parseCookieHeader(req.header('cookie'));
    if (typeof cookies.csrf_token === 'string' && cookies.csrf_token.length > 0) {
      req.session.csrf_token = cookies.csrf_token;
    } else {
      req.session.csrf_token = createCsrfToken();
      const policy = resolveCsrfCookiePolicy(env);
      res.cookie?.('csrf_token', req.session.csrf_token, { httpOnly: false, path: '/', secure: policy.secure, sameSite: policy.sameSite });
    }
    res.locals.csrfToken = req.session.csrf_token;
    req.context.requestId = req.header('x-request-id') || crypto.randomUUID();
    res.setHeader('x-request-id', req.context.requestId);
    next();
  });
};

module.exports = setupMiddleware;
