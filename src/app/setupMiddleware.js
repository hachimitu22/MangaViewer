const path = require('path');
const crypto = require('crypto');
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

const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

const resolveCsrfCookiePolicy = env => {
  const nodeEnv = String(env.nodeEnv || process.env.NODE_ENV || '').toLowerCase();
  const isProduction = nodeEnv === 'production';

  return {
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
  };
};

const isProductionEnvironment = env => {
  const nodeEnv = String(env.nodeEnv || process.env.NODE_ENV || '').toLowerCase();
  return nodeEnv === 'production';
};

const createContentSecurityPolicy = ({ nonce }) => {
  const directives = [
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
  ];

  return directives.join('; ');
};

const applySecurityHeaders = ({ res, isProduction, cspValue }) => {
  res.setHeader('Content-Security-Policy', cspValue);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');

  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
};

const setupMiddleware = (app, { env = {}, dependencies: _dependencies } = {}) => {
  app.locals = app.locals ?? {};
  if (typeof app.locals.env === 'undefined') {
    app.locals.env = env;
  }

  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'ejs');
  if (typeof env.contentRootDirectory === 'string' && env.contentRootDirectory.length > 0) {
    app.use('/contents', express.static(env.contentRootDirectory));
  }
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    req.context = req.context ?? {};
    attachSessionHelpers(req);

    const securityNonce = crypto.randomBytes(16).toString('base64');
    req.context.cspNonce = securityNonce;

    res.locals = res.locals ?? {};
    res.locals.cspNonce = securityNonce;

    const cspValue = createContentSecurityPolicy({ nonce: securityNonce });
    applySecurityHeaders({
      res,
      isProduction: isProductionEnvironment(env),
      cspValue,
    });

    const cookies = parseCookieHeader(req.header('cookie'));
    const legacySessionToken = req.header('x-session-token');

    if (typeof cookies.session_token === 'string' && cookies.session_token.length > 0) {
      req.session.session_token = cookies.session_token;
    } else if (shouldApplyDevelopmentSession({ env, requestPath: req.path })) {
      req.session.session_token = env.devSessionToken;
    }

    if (typeof cookies.csrf_token === 'string' && cookies.csrf_token.length > 0) {
      req.session.csrf_token = cookies.csrf_token;
    } else {
      req.session.csrf_token = createCsrfToken();
      const policy = resolveCsrfCookiePolicy(env);
      res.cookie?.('csrf_token', req.session.csrf_token, {
        httpOnly: false,
        path: '/',
        secure: policy.secure,
        sameSite: policy.sameSite,
      });
    }

    res.locals.csrfToken = req.session.csrf_token;

    const logger = req.app?.locals?.dependencies?.logger;

    if (typeof legacySessionToken === 'string' && legacySessionToken.length > 0) {
      logger?.warn('auth.legacy_session_token_header.detected', {
        count: 1,
        source_ip: req.ip || req.socket?.remoteAddress || null,
        user_agent: req.header('user-agent') || '',
      });
    }
    const startedAt = Date.now();
    const requestId = req.header('x-request-id') || crypto.randomUUID();
    req.context.requestId = requestId;

    if (typeof res.setHeader === 'function') {
      res.setHeader('x-request-id', requestId);
    }
    logger?.debug('http.request.started', {
      request_id: requestId,
      method: req.method,
      path: req.originalUrl,
      user_id: req.context?.userId || 'anonymous',
    });

    if (typeof res.on === 'function') {
      res.on('finish', () => {
        const durationMs = Date.now() - startedAt;
        logger?.info('http.request.completed', {
          request_id: requestId,
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          duration_ms: durationMs,
          user_id: req.context?.userId || 'anonymous',
        });
      });
    }

    next();
  });
};

module.exports = setupMiddleware;
