const { hashPassword } = require('./auth/fixedUserPasswordHasher');

class StaticLoginAuthenticator {
  #username;
  #passwordHash;
  #userId;

  constructor({ username, password, passwordHash, userId } = {}) {
    if (!this.#isNonEmptyString(username)) {
      throw new Error('username must be a non-empty string');
    }

    if (!this.#isNonEmptyString(passwordHash) && !this.#isNonEmptyString(password)) {
      throw new Error('password must be a non-empty string');
    }

    if (!this.#isNonEmptyString(userId)) {
      throw new Error('userId must be a non-empty string');
    }

    this.#username = username;
    this.#passwordHash = this.#isNonEmptyString(passwordHash) ? passwordHash : hashPassword(password);
    this.#userId = userId;
  }

  async execute({ username, password } = {}) {
    if (username !== this.#username || !this.#isNonEmptyString(password)) {
      return null;
    }

    if (hashPassword(password) === this.#passwordHash) {
      return this.#userId;
    }

    return null;
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }
}

module.exports = StaticLoginAuthenticator;
