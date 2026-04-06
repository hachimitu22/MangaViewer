const {
  Query: LoginQuery,
  LoginSucceededResult,
} = require('../../application/user/command/LoginService');

class LoginPostController {
  #loginService;

  constructor({ loginService } = {}) {
    if (!loginService || typeof loginService.execute !== 'function') {
      throw new Error('loginService.execute must be a function');
    }

    this.#loginService = loginService;
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

      const result = await this.#loginService.execute(new LoginQuery({
        username,
        password,
        session,
      }));

      if (result instanceof LoginSucceededResult) {
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
        logger?.warn('auth.login.failed', {
          request_id: requestId,
          reason: 'authentication_failed',
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
      // ローカル開発(http)では false、本番(https)では true を強制する。
      secure: isProduction,
      // 本番は厳しめに strict、非本番は開発しやすさを考慮して lax。
      sameSite: isProduction ? 'strict' : 'lax',
      // セッション有効期限と Cookie 期限を一致させる。
      maxAge: sessionTtlMs,
    };
  }

  #fail(res) {
    return res.status(200).json({ code: 1 });
  }
}

module.exports = LoginPostController;
