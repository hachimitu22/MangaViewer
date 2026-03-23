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
    try {
      const username = req?.body?.username;
      const password = req?.body?.password;
      const session = req?.session;

      if (!this.#isValidCredential(username) || !this.#isValidCredential(password) || !session) {
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
      }

      return res.status(200).json({ code: result.code });
    } catch (_error) {
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
