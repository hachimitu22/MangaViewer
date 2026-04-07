class LoginRateLimiter {
  #loginAttemptStore;

  #maxAttemptsPerWindow;

  #windowMs;

  constructor({ loginAttemptStore, maxAttemptsPerWindow = 5, windowMs = 60_000 } = {}) {
    if (!loginAttemptStore || typeof loginAttemptStore.consumeRateLimit !== 'function') {
      throw new Error('loginAttemptStore.consumeRateLimit must be a function');
    }

    this.#loginAttemptStore = loginAttemptStore;
    this.#maxAttemptsPerWindow = maxAttemptsPerWindow;
    this.#windowMs = windowMs;
  }

  execute(req, res, next) {
    const nowMs = Date.now();
    const logger = req.app?.locals?.dependencies?.logger;
    const requestId = req.context?.requestId;
    const ipAddress = this.#resolveIpAddress(req);
    const username = this.#resolveUsername(req);
    const rateLimitKey = this.#buildRateLimitKey({ ipAddress, username });

    const ipCounter = this.#loginAttemptStore.consumeRateLimit({
      scope: 'ip',
      key: rateLimitKey,
      windowMs: this.#windowMs,
      nowMs,
    });

    if (ipCounter.count > this.#maxAttemptsPerWindow) {
      logger?.warn('auth.login.failed', {
        request_id: requestId,
        reason: 'rate_limited',
        ip_address: ipAddress,
        username,
      });
      return res.status(429).json({ code: 1 });
    }

    return next();
  }

  #resolveUsername(req) {
    const username = req?.body?.username;
    if (typeof username !== 'string' || username.length === 0) {
      return 'anonymous';
    }

    return username;
  }

  #resolveIpAddress(req) {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  #buildRateLimitKey({ ipAddress, username }) {
    return `ip:${ipAddress}|user:${username}`;
  }
}

module.exports = LoginRateLimiter;
