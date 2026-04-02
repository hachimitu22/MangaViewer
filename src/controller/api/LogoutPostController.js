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
        logger?.warn('auth.logout.failed', {
          request_id: requestId,
          reason: 'missing_session',
        });
        return this.#fail(res);
      }

      const result = await this.#logoutService.execute(new LogoutQuery({ session }));
      logger?.info('auth.logout', {
        request_id: requestId,
      });
      return res.status(200).json({ code: result.code });
    } catch (error) {
      logger?.error('auth.logout.error', {
        request_id: requestId,
        message: error?.message,
        error,
      });
      return this.#fail(res);
    }
  }

  #fail(res) {
    return res.status(200).json({ code: 1 });
  }
}

module.exports = LogoutPostController;
