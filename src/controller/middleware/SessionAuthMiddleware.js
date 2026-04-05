class SessionAuthMiddleware {
  #authAdapter;

  constructor(authAdapter = {}) {
    if (typeof authAdapter?.execute !== 'function') {
      throw new Error('authAdapter.execute must be a function');
    }

    this.#authAdapter = authAdapter;
  }

  async execute(req, res, next) {
    try {
      const token = req?.session?.session_token;
      if (!this.#isValidTokenFormat(token)) {
        return this.#unauthorized(req, res);
      }

      const userId = await this.#authAdapter.execute(token);
      if (!this.#isNonEmptyString(userId)) {
        return this.#unauthorized(req, res);
      }

      if (!req.context || typeof req.context !== 'object') {
        req.context = {};
      }

      req.context.userId = userId;
      return next();
    } catch (_error) {
      return this.#unauthorized(req, res);
    }
  }

  #isValidTokenFormat(token) {
    return this.#isNonEmptyString(token);
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }

  #unauthorized(req, res) {
    const path = typeof req?.originalUrl === 'string' ? req.originalUrl : '';
    if (path.startsWith('/api/')) {
      return res.status(401).json({
        message: '認証に失敗しました',
        redirectTo: '/screen/error',
      });
    }

    return res.redirect('/screen/error');
  }
}

module.exports = SessionAuthMiddleware;
