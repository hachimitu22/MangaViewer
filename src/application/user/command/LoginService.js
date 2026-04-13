class Query {
  constructor({ username, password, session } = {}) {
    if (typeof username !== 'string' || username.length === 0) {
      throw new Error('username must be a non-empty string');
    }
    if (typeof password !== 'string' || password.length === 0) {
      throw new Error('password must be a non-empty string');
    }
    if (!session || typeof session !== 'object') {
      throw new Error('session must be an object');
    }

    this.username = username;
    this.password = password;
    this.session = session;
  }
}

class Result {
  constructor({ code, sessionToken = null } = {}) {
    this.code = code;
    this.sessionToken = sessionToken;
  }
}

class LoginSucceededResult extends Result {
  constructor({ sessionToken }) {
    super({ code: 0, sessionToken });
  }
}

class LoginFailedResult extends Result {
  constructor() {
    super({ code: 1 });
  }
}

class LoginService {
  #loginAuthenticator;
  #sessionStateRegistrar;
  #sessionTtlMs;

  constructor({ loginAuthenticator, sessionStateRegistrar, sessionTtlMs = 86_400_000 } = {}) {
    if (!loginAuthenticator || typeof loginAuthenticator.execute !== 'function') {
      throw new Error('loginAuthenticator.execute must be a function');
    }
    if (!sessionStateRegistrar || typeof sessionStateRegistrar.execute !== 'function') {
      throw new Error('sessionStateRegistrar.execute must be a function');
    }
    if (!Number.isInteger(sessionTtlMs) || sessionTtlMs <= 0) {
      throw new Error('sessionTtlMs must be a positive integer');
    }

    this.#loginAuthenticator = loginAuthenticator;
    this.#sessionStateRegistrar = sessionStateRegistrar;
    this.#sessionTtlMs = sessionTtlMs;
  }

  async execute(query) {
    if (!(query instanceof Query)) {
      throw new Error('query must be an instance of Query');
    }

    const userId = await this.#loginAuthenticator.execute({
      username: query.username,
      password: query.password,
    });

    if (!this.#isNonEmptyString(userId)) {
      return new LoginFailedResult();
    }

    const sessionState = await this.#sessionStateRegistrar.execute({
      session: query.session,
      userId,
      ttlMs: this.#sessionTtlMs,
    });

    return new LoginSucceededResult({
      sessionToken: sessionState.sessionToken,
    });
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }
}

module.exports = {
  Query,
  LoginSucceededResult,
  LoginFailedResult,
  LoginService,
};
