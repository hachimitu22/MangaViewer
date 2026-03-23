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
    try {
      const session = req?.session;
      if (!session) {
        return this.#fail(res);
      }

      const result = await this.#logoutService.execute(new LogoutQuery({ session }));
      return res.status(200).json({ code: result.code });
    } catch (_error) {
      return this.#fail(res);
    }
  }

  #fail(res) {
    return res.status(200).json({ code: 1 });
  }
}

module.exports = LogoutPostController;
