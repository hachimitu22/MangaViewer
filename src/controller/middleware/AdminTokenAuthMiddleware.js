class AdminTokenAuthMiddleware {
  #expectedToken;

  constructor({ expectedToken } = {}) {
    this.#expectedToken = typeof expectedToken === 'string' ? expectedToken.trim() : '';
  }

  execute(req, res, next) {
    const token = this.#resolveToken(req);
    if (!this.#isAuthorized(token)) {
      return res.status(401).json({
        message: '認証に失敗しました',
      });
    }

    return next();
  }

  #resolveToken(req) {
    const headerToken = req.get('x-admin-token');
    if (typeof headerToken === 'string' && headerToken.trim().length > 0) {
      return headerToken.trim();
    }

    const authorization = req.get('authorization');
    if (typeof authorization !== 'string') {
      return '';
    }

    const match = authorization.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : '';
  }

  #isAuthorized(token) {
    if (this.#expectedToken.length === 0) {
      return false;
    }

    return token.length > 0 && token === this.#expectedToken;
  }
}

module.exports = AdminTokenAuthMiddleware;
