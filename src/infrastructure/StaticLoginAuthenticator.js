const {
  hashPassword,
  verifyPassword,
  detectHashScheme,
} = require('./auth/passwordHasher');

class StaticLoginAuthenticator {
  #username;
  #passwordHash;
  #userId;
  #hashOptions;
  #onPasswordHashUpgrade;

  constructor({
    username,
    password,
    passwordHash,
    userId,
    hashOptions,
    onPasswordHashUpgrade,
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

    if (onPasswordHashUpgrade !== undefined && typeof onPasswordHashUpgrade !== 'function') {
      throw new Error('onPasswordHashUpgrade must be a function');
    }

    this.#username = username;
    this.#hashOptions = hashOptions;
    this.#passwordHash = this.#isNonEmptyString(passwordHash) ? passwordHash : hashPassword(password, this.#hashOptions);
    this.#userId = userId;
    this.#onPasswordHashUpgrade = onPasswordHashUpgrade;
  }

  async execute({ username, password } = {}) {
    if (username !== this.#username || !this.#isNonEmptyString(password)) {
      return null;
    }

    if (!verifyPassword(password, this.#passwordHash)) {
      return null;
    }

    if (detectHashScheme(this.#passwordHash) === 'sha256') {
      const upgradedHash = hashPassword(password, this.#hashOptions);
      await this.#notifyPasswordHashUpgrade(upgradedHash);
      this.#passwordHash = upgradedHash;
    }

    return this.#userId;
  }

  async #notifyPasswordHashUpgrade(nextPasswordHash) {
    if (typeof this.#onPasswordHashUpgrade !== 'function') {
      return;
    }

    await this.#onPasswordHashUpgrade({
      username: this.#username,
      userId: this.#userId,
      passwordHash: nextPasswordHash,
      reason: 'legacy-sha256-migrated',
    });
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }
}

module.exports = StaticLoginAuthenticator;
