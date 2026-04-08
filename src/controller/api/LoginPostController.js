const {
  Query: LoginQuery,
  LoginSucceededResult,
} = require('../../application/user/command/LoginService');

class LoginPostController {
  #loginService;

  #loginAttemptStore;

  constructor({ loginService, loginAttemptStore } = {}) {
    if (!loginService || typeof loginService.execute !== 'function') {
      throw new Error('loginService.execute must be a function');
    }
    if (!loginAttemptStore || typeof loginAttemptStore.recordAuthenticationFailure !== 'function') {
      throw new Error('loginAttemptStore.recordAuthenticationFailure must be a function');
    }
    if (typeof loginAttemptStore.clearRateLimit !== 'function') {
      throw new Error('loginAttemptStore.clearRateLimit must be a function');
    }

    this.#loginService = loginService;
    this.#loginAttemptStore = loginAttemptStore;
  }

  async execute(req, res) {
    const logger = req.app?.locals?.dependencies?.logger;
    const requestId = req.context?.requestId;
    try {
      const username = req?.body?.username;
      const password = req?.body?.password;
      const session = req?.session;
      const ipAddress = this.#resolveIpAddress(req);
      const storeFailurePolicy = this.#resolveStoreFailurePolicy(req);

      if (!this.#isValidCredential(username) || !this.#isValidCredential(password) || !session) {
        logger?.warn('auth.login.failed', {
          request_id: requestId,
          reason: 'invalid_input',
        });
        return this.#fail(res);
      }

      try {
        const lockState = await this.#loginAttemptStore.getTemporaryLockState({ key: username });
        if (lockState.isLocked) {
          logger?.warn('auth.login.failed', {
            request_id: requestId,
            reason: 'temporarily_locked',
            username,
            lock_until_ms: lockState.lockUntilMs,
          });
          return res.status(429).json({ code: 1 });
        }
      } catch (error) {
        logger?.warn('auth.login.failed', {
          request_id: requestId,
          reason: 'lock_store_unavailable',
          username,
          store_failure_policy: storeFailurePolicy,
          store_error_message: error?.message,
        });
        if (storeFailurePolicy === 'fail_close') {
          return res.status(503).json({ code: 1 });
        }
      }

      const result = await this.#loginService.execute(new LoginQuery({
        username,
        password,
        session,
      }));

      if (result instanceof LoginSucceededResult) {
        await this.#handleAuthenticationSuccess({ req, requestId, username, ipAddress });
        const cookiePolicy = this.#resolveSessionCookiePolicy(req);
        res.cookie('session_token', result.sessionToken, {
          httpOnly: true,
          path: '/',
          secure: cookiePolicy.secure,
          sameSite: cookiePolicy.sameSite,
          maxAge: cookiePolicy.maxAge,
        });

        logger?.info('auth.login.success', {
          request_id: requestId,
          user_id: session.user_id || 'unknown',
        });
      } else {
        await this.#handleAuthenticationFailure({ req, requestId, username });
      }

      return res.status(200).json({ code: result.code });
    } catch (error) {
      logger?.error('auth.login.error', {
        request_id: requestId,
        message: error?.message,
        error,
      });
      return this.#fail(res);
    }
  }

  async #handleAuthenticationSuccess({ req, requestId, username, ipAddress }) {
    const logger = req.app?.locals?.dependencies?.logger;

    try {
      await this.#loginAttemptStore.clearAuthenticationFailures({ key: username });
      await this.#loginAttemptStore.clearRateLimit({
        scope: 'ip',
        key: this.#buildRateLimitKey({ ipAddress, username }),
      });
    } catch (error) {
      logger?.warn('auth.login.store_cleanup_failed', {
        request_id: requestId,
        username,
        reason: error?.message,
      });
    }
  }

  async #handleAuthenticationFailure({ req, requestId, username }) {
    const logger = req.app?.locals?.dependencies?.logger;
    const storeFailurePolicy = this.#resolveStoreFailurePolicy(req);

    try {
      const failureState = await this.#loginAttemptStore.recordAuthenticationFailure({ key: username });
      logger?.warn('auth.login.failed', {
        request_id: requestId,
        reason: 'authentication_failed',
        username,
        failure_count: failureState.failureCount,
        lock_until_ms: failureState.lockUntilMs,
      });
      return;
    } catch (error) {
      logger?.warn('auth.login.failed', {
        request_id: requestId,
        reason: 'failure_count_store_unavailable',
        username,
        store_failure_policy: storeFailurePolicy,
        store_error_message: error?.message,
      });

      if (storeFailurePolicy === 'fail_close') {
        throw new Error('login failure state could not be persisted');
      }
    }
  }

  #resolveStoreFailurePolicy(req) {
    const policy = String(req?.app?.locals?.env?.authStoreFailurePolicy || 'fail_close').toLowerCase();
    return policy === 'fail_open' ? 'fail_open' : 'fail_close';
  }

  #isValidCredential(value) {
    return typeof value === 'string' && value.length > 0;
  }

  #resolveSessionCookiePolicy(req) {
    const env = req?.app?.locals?.env ?? {};
    const nodeEnv = String(env.nodeEnv || process.env.NODE_ENV || '').toLowerCase();
    const isProduction = nodeEnv === 'production';
    const sessionTtlMs = Number.isFinite(env.loginSessionTtlMs) && env.loginSessionTtlMs > 0
      ? env.loginSessionTtlMs
      : 86_400_000;

    return {
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: sessionTtlMs,
    };
  }

  #resolveIpAddress(req) {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  #buildRateLimitKey({ ipAddress, username }) {
    const resolvedIpAddress = typeof ipAddress === 'string' && ipAddress.length > 0 ? ipAddress : 'unknown';
    const resolvedUsername = typeof username === 'string' && username.length > 0 ? username : 'anonymous';
    return `ip:${resolvedIpAddress}|user:${resolvedUsername}`;
  }

  #fail(res) {
    return res.status(200).json({ code: 1 });
  }
}

module.exports = LoginPostController;
