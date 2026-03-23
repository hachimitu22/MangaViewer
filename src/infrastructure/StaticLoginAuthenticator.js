class StaticLoginAuthenticator {
  #username;
  #password;
  #userId;

  constructor({ username, password, userId } = {}) {
    if (!this.#isNonEmptyString(username)) {
      throw new Error('username must be a non-empty string');
    }
    if (!this.#isNonEmptyString(password)) {
      throw new Error('password must be a non-empty string');
    }
    if (!this.#isNonEmptyString(userId)) {
      throw new Error('userId must be a non-empty string');
    }

    this.#username = username;
    this.#password = password;
    this.#userId = userId;
  }

  async execute({ username, password } = {}) {
    if (username === this.#username && password === this.#password) {
      return this.#userId;
    }

    return null;
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }
}

module.exports = StaticLoginAuthenticator;
