class SessionAuthMiddleware {
  #resolveUserIdBySessionToken;

  #logger;

  constructor({ resolveUserIdBySessionToken, logger } = {}) {
    if (typeof resolveUserIdBySessionToken !== 'function') {
      throw new Error('resolveUserIdBySessionToken must be a function');
    }

    this.#resolveUserIdBySessionToken = resolveUserIdBySessionToken;
    this.#logger = logger ?? console;
  }

  async execute(req, res, next) {
    try {
      const token = req?.session?.session_token;
      if (!this.#isValidTokenFormat(token)) {
        this.#logAuthFailure('invalid-token', token);
        return this.#unauthorized(res);
      }

      const userId = await this.#resolveUserIdBySessionToken(token);
      if (!this.#isNonEmptyString(userId)) {
        this.#logAuthFailure('user-not-resolved', token);
        return this.#unauthorized(res);
      }

      if (!req.context || typeof req.context !== 'object') {
        req.context = {};
      }

      req.context.userId = userId;
      return next();
    } catch (error) {
      const token = req?.session?.session_token;
      this.#logAuthFailure('unexpected-error', token);
      return this.#unauthorized(res);
    }
  }

  #isValidTokenFormat(token) {
    return this.#isNonEmptyString(token);
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }

  #unauthorized(res) {
    return res.status(401).json({
      message: '認証に失敗しました',
    });
  }

  #logAuthFailure(reason, token) {
    const message = 'SessionAuthMiddleware authentication failed';
    const meta = {
      reason,
      sessionToken: this.#maskToken(token),
    };

    if (this.#logger && typeof this.#logger.warn === 'function') {
      this.#logger.warn(message, meta);
    }
  }

  #maskToken(token) {
    if (typeof token !== 'string' || token.length === 0) {
      return 'N/A';
    }

    if (token.length <= 4) {
      return '****';
    }

    return `${token.slice(0, 2)}****${token.slice(-2)}`;
  }
}

module.exports = SessionAuthMiddleware;
