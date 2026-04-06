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

      if (!this.#isValidCredential(username) || !this.#isValidCredential(password) || !session) {
        logger?.warn('auth.login.failed', {
          request_id: requestId,
          reason: 'invalid_input',
        });
        return this.#fail(res);
      }

      const lockState = this.#loginAttemptStore.getTemporaryLockState({ key: username });
      if (lockState.isLocked) {
        logger?.warn('auth.login.failed', {
          request_id: requestId,
          reason: 'temporarily_locked',
          username,
          lock_until_ms: lockState.lockUntilMs,
        });
        return res.status(429).json({ code: 1 });
      }

      const result = await this.#loginService.execute(new LoginQuery({
        username,
        password,
        session,
      }));

      if (result instanceof LoginSucceededResult) {
        this.#loginAttemptStore.clearAuthenticationFailures({ key: username });
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
        const failureState = this.#loginAttemptStore.recordAuthenticationFailure({ key: username });
        logger?.warn('auth.login.failed', {
          request_id: requestId,
          reason: 'authentication_failed',
          username,
          failure_count: failureState.failureCount,
          lock_until_ms: failureState.lockUntilMs,
        });
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

  #fail(res) {
    return res.status(200).json({ code: 1 });
  }
}

module.exports = LoginPostController;
