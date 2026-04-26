class CsrfProtectionMiddleware {
  #options;

  constructor({
    excludedPaths = [],
    allowedOrigin,
  } = {}) {
    this.#options = {
      excludedPaths: new Set(Array.isArray(excludedPaths) ? excludedPaths : []),
      allowedOrigin,
    };
  }

  execute(req, res, next) {
    if (!this.#shouldValidate(req)) {
      return next();
    }

    const logger = req.app?.locals?.dependencies?.logger;
    const cookieToken = this.#resolveCsrfTokenFromCookie(req);
    const headerToken = req.get('x-csrf-token');

    if (!this.#isNonEmptyString(cookieToken) || headerToken !== cookieToken) {
      logger?.warn('security.csrf.validation_failed', {
        request_id: req.context?.requestId,
        reason: 'csrf_token_mismatch',
      });
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    const expectedOrigin = this.#resolveExpectedOrigin(req);
    const actualOrigin = this.#resolveActualOrigin(req);

    if (!this.#isNonEmptyString(expectedOrigin) || actualOrigin !== expectedOrigin) {
      logger?.warn('security.csrf.validation_failed', {
        request_id: req.context?.requestId,
        reason: 'origin_mismatch',
        expected_origin: expectedOrigin,
        actual_origin: actualOrigin,
      });
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    return next();
  }

  #shouldValidate(req) {
    const method = String(req?.method || '').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return false;
    }

    const path = req?.path || req?.originalUrl || '';
    return !this.#options.excludedPaths.has(path);
  }

  #resolveExpectedOrigin(req) {
    const configured = this.#options.allowedOrigin
      || req?.app?.locals?.env?.appOrigin;

    if (this.#isNonEmptyString(configured)) {
      try {
        return new URL(configured).origin;
      } catch (_error) {
        return null;
      }
    }

    if (String(process.env.NODE_ENV || '').toLowerCase() === 'test') {
      const actualOrigin = this.#resolveActualOrigin(req);
      if (this.#isLoopbackOrigin(actualOrigin)) {
        return actualOrigin;
      }
    }
    return null;
  }

  #resolveActualOrigin(req) {
    const originHeader = req.get('origin');
    if (this.#isNonEmptyString(originHeader)) {
      try {
        return new URL(originHeader).origin;
      } catch (_error) {
        return null;
      }
    }

    const refererHeader = req.get('referer');
    if (this.#isNonEmptyString(refererHeader)) {
      try {
        return new URL(refererHeader).origin;
      } catch (_error) {
        return null;
      }
    }

    return null;
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }

  #isLoopbackOrigin(origin) {
    if (!this.#isNonEmptyString(origin)) {
      return false;
    }

    try {
      const hostname = new URL(origin).hostname.toLowerCase();
      return hostname === '127.0.0.1'
        || hostname === 'localhost'
        || hostname === '::1'
        || hostname === '[::1]';
    } catch (_error) {
      return false;
    }
  }

  #resolveCsrfTokenFromCookie(req) {
    const cookieHeader = req.get('cookie');
    if (!this.#isNonEmptyString(cookieHeader)) {
      return null;
    }

    const csrfCookie = cookieHeader
      .split(';')
      .map(entry => entry.trim())
      .find(entry => entry.startsWith('csrf_token='));

    if (!this.#isNonEmptyString(csrfCookie)) {
      return null;
    }

    const separatorIndex = csrfCookie.indexOf('=');
    if (separatorIndex <= 0) {
      return null;
    }

    const value = csrfCookie.slice(separatorIndex + 1).trim();
    return this.#isNonEmptyString(value) ? value : null;
  }
}

module.exports = CsrfProtectionMiddleware;
