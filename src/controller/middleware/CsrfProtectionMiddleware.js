class CsrfProtectionMiddleware {
  #options;

  constructor({
    excludedPaths = ['/api/login'],
    allowedOrigin,
  } = {}) {
    this.#options = {
      excludedPaths: new Set(Array.isArray(excludedPaths) ? excludedPaths : ['/api/login']),
      allowedOrigin,
    };
  }

  execute(req, res, next) {
    if (!this.#shouldValidate(req)) {
      return next();
    }

    const logger = req.app?.locals?.dependencies?.logger;
    const sessionToken = req?.session?.csrf_token;
    const headerToken = req.get('x-csrf-token');

    if (!this.#isNonEmptyString(sessionToken) || headerToken !== sessionToken) {
      logger?.warn('security.csrf.validation_failed', {
        request_id: req.context?.requestId,
        user_id: req.context?.userId || req.session?.user_id || 'anonymous',
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
        user_id: req.context?.userId || req.session?.user_id || 'anonymous',
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

    const host = req.get('host');
    if (!this.#isNonEmptyString(host)) {
      return null;
    }

    const protocol = req.protocol || 'http';
    return `${protocol}://${host}`;
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
}

module.exports = CsrfProtectionMiddleware;
