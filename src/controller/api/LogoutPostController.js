const {
  Query: LogoutQuery,
} = require('../../application/user/command/LogoutService');

class LogoutPostController {
  #logoutService;

  constructor({ logoutService } = {}) {
    if (!logoutService || typeof logoutService.execute !== 'function') {
      throw new Error('logoutService.execute must be a function');
    }

    this.#logoutService = logoutService;
  }

  async execute(req, res) {
    const logger = req.app?.locals?.dependencies?.logger;
    const requestId = req.context?.requestId;
    try {
      const session = req?.session;
      if (!session) {
        this.#clearSessionCookie(req, res);
        logger?.warn('auth.logout.failed', {
          request_id: requestId,
          reason: 'missing_session',
        });
        return this.#failUnauthorized(res);
      }

      const result = await this.#logoutService.execute(new LogoutQuery({ session }));
      this.#clearSessionCookie(req, res);
      logger?.info('auth.logout', {
        request_id: requestId,
      });
      return res.status(200).json({ code: result.code });
    } catch (error) {
      this.#clearSessionCookie(req, res);
      logger?.error('auth.logout.error', {
        request_id: requestId,
        message: error?.message,
        error,
      });
      return this.#failServerError(res);
    }
  }

  #clearSessionCookie(req, res) {
    const cookiePolicy = this.#resolveSessionCookiePolicy(req);
    res?.clearCookie?.('session_token', {
      httpOnly: true,
      path: '/',
      secure: cookiePolicy.secure,
      sameSite: cookiePolicy.sameSite,
    });
    res?.clearCookie?.('csrf_token', {
      httpOnly: false,
      path: '/',
      secure: cookiePolicy.secure,
      sameSite: cookiePolicy.sameSite,
    });
  }

  #resolveSessionCookiePolicy(req) {
    const env = req?.app?.locals?.env ?? {};
    const nodeEnv = String(env.nodeEnv || process.env.NODE_ENV || '').toLowerCase();
    const isProduction = nodeEnv === 'production';

    return {
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
    };
  }

  #failUnauthorized(res) {
    return res.status(401).json({
      message: '認証に失敗しました',
    });
  }

  #failServerError(res) {
    return res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

module.exports = LogoutPostController;
