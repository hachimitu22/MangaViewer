class Query {
  constructor({ session } = {}) {
    if (!session || typeof session !== 'object') {
      throw new Error('session must be an object');
    }

    this.session = session;
  }
}

class LogoutSucceededResult {
  constructor() {
    this.code = 0;
  }
}

class LogoutFailedResult {
  constructor() {
    this.code = 1;
  }
}

class LogoutService {
  #sessionTerminator;

  constructor({ sessionTerminator } = {}) {
    if (!sessionTerminator || typeof sessionTerminator.execute !== 'function') {
      throw new Error('sessionTerminator.execute must be a function');
    }

    this.#sessionTerminator = sessionTerminator;
  }

  async execute(query) {
    if (!(query instanceof Query)) {
      throw new Error('query must be an instance of Query');
    }

    const terminated = await this.#sessionTerminator.execute({
      session: query.session,
    });

    if (!terminated) {
      return new LogoutFailedResult();
    }

    return new LogoutSucceededResult();
  }
}

module.exports = {
  Query,
  LogoutSucceededResult,
  LogoutFailedResult,
  LogoutService,
};
