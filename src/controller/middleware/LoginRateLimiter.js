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

  async execute(req, res, next) {
    const nowMs = Date.now();
    const logger = req.app?.locals?.dependencies?.logger;
    const requestId = req.context?.requestId;
    const ipAddress = this.#resolveIpAddress(req);
    const username = this.#resolveUsername(req);
    const storeFailurePolicy = this.#resolveStoreFailurePolicy(req);

    const targets = [
      { scope: 'ip', key: ipAddress },
      { scope: 'account', key: username },
    ];

    for (const target of targets) {
      let counter;
      try {
        counter = await this.#loginAttemptStore.consumeRateLimit({
          scope: target.scope,
          key: target.key,
          windowMs: this.#windowMs,
          nowMs,
        });
      } catch (error) {
        logger?.warn('auth.login.failed', {
          request_id: requestId,
          reason: 'rate_limit_store_unavailable',
          ip_address: ipAddress,
          username,
          scope: target.scope,
          store_failure_policy: storeFailurePolicy,
          store_error_message: error?.message,
        });

        if (storeFailurePolicy === 'fail_open') {
          return next();
        }

        return res.status(503).json({ code: 1 });
      }

      if (counter.count > this.#maxAttemptsPerWindow) {
        logger?.warn('auth.login.failed', {
          request_id: requestId,
          reason: 'rate_limited',
          ip_address: ipAddress,
          username,
          scope: target.scope,
          remaining: this.#resolveRemaining(counter),
        });
        return res.status(429).json({ code: 1 });
      }
    }

    return next();
  }

  #resolveRemaining(counter) {
    if (Number.isFinite(counter?.remaining)) {
      return counter.remaining;
    }

    if (Number.isFinite(counter?.count)) {
      return Math.max(this.#maxAttemptsPerWindow - counter.count, 0);
    }

    return undefined;
  }

  #resolveStoreFailurePolicy(req) {
    const policy = String(req?.app?.locals?.env?.authStoreFailurePolicy || 'fail_close').toLowerCase();
    return policy === 'fail_open' ? 'fail_open' : 'fail_close';
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
}

module.exports = LoginRateLimiter;
