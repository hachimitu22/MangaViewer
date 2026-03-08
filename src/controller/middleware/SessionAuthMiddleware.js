class SessionAuthMiddleware {
  #resolveUserIdBySessionToken;

  constructor(authResolverOrOptions = {}) {
    const resolveUserIdBySessionToken = this.#resolve(authResolverOrOptions);
    if (typeof resolveUserIdBySessionToken !== 'function') {
      throw new Error('resolveUserIdBySessionToken must be a function');
    }

    this.#resolveUserIdBySessionToken = resolveUserIdBySessionToken;
  }


  #resolve(authResolverOrOptions) {
    if (authResolverOrOptions && typeof authResolverOrOptions.execute === 'function') {
      return authResolverOrOptions.execute.bind(authResolverOrOptions);
    }

    return authResolverOrOptions?.resolveUserIdBySessionToken;
  }

  async execute(req, res, next) {
    try {
      const token = req?.session?.session_token;
      if (!this.#isValidTokenFormat(token)) {
        return this.#unauthorized(res);
      }

      const userId = await this.#resolveUserIdBySessionToken(token);
      if (!this.#isNonEmptyString(userId)) {
        return this.#unauthorized(res);
      }

      if (!req.context || typeof req.context !== 'object') {
        req.context = {};
      }

      req.context.userId = userId;
      return next();
    } catch (_error) {
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
}

module.exports = SessionAuthMiddleware;
