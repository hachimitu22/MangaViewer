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
        res.cookie('session_token', result.sessionToken, {
          httpOnly: true,
          path: '/',
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

  #fail(res) {
    return res.status(200).json({ code: 1 });
  }
}

module.exports = LoginPostController;
