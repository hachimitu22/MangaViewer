const { hashPassword, verifyPassword } = require('./auth/fixedUserPasswordHasher');

class StaticLoginAuthenticator {
  #username;
  #passwordHash;
  #userId;
  #passwordHashUpdater;
  #passwordHashOptions;

  constructor({
    username,
    password,
    passwordHash,
    userId,
    passwordHashUpdater,
    passwordHashOptions,
  } = {}) {
    if (!this.#isNonEmptyString(username)) {
      throw new Error('username must be a non-empty string');
    }

    if (!this.#isNonEmptyString(passwordHash) && !this.#isNonEmptyString(password)) {
      throw new Error('password must be a non-empty string');
    }

    if (!this.#isNonEmptyString(userId)) {
      throw new Error('userId must be a non-empty string');
    }

    if (passwordHashUpdater !== undefined && typeof passwordHashUpdater !== 'function') {
      throw new Error('passwordHashUpdater must be a function');
    }

    this.#username = username;
    this.#passwordHash = this.#isNonEmptyString(passwordHash)
      ? passwordHash
      : hashPassword(password, passwordHashOptions);
    this.#userId = userId;
    this.#passwordHashUpdater = passwordHashUpdater;
    this.#passwordHashOptions = passwordHashOptions;
  }

  async execute({ username, password } = {}) {
    if (username !== this.#username || !this.#isNonEmptyString(password)) {
      return null;
    }

    const verifyResult = verifyPassword({ password, passwordHash: this.#passwordHash });
    if (!verifyResult.verified) {
      return null;
    }

    if (verifyResult.needsRehash) {
      const upgradedPasswordHash = hashPassword(password, this.#passwordHashOptions);
      this.#passwordHash = upgradedPasswordHash;

      if (this.#passwordHashUpdater) {
        await this.#passwordHashUpdater({
          userId: this.#userId,
          username: this.#username,
          passwordHash: upgradedPasswordHash,
          previousScheme: verifyResult.scheme,
        });
      }
    }

    return this.#userId;
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }
}

module.exports = StaticLoginAuthenticator;
