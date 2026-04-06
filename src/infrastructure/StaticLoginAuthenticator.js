const {
  hashPassword,
  verifyPassword,
} = require('./auth/fixedUserPasswordHasher');

class StaticLoginAuthenticator {
  #username;
  #passwordHash;
  #userId;
  #onPasswordRehashRequired;

  constructor({ username, password, passwordHash, userId, onPasswordRehashRequired } = {}) {
    if (!this.#isNonEmptyString(username)) {
      throw new Error('username must be a non-empty string');
    }

    if (!this.#isNonEmptyString(passwordHash) && !this.#isNonEmptyString(password)) {
      throw new Error('password must be a non-empty string');
    }

    if (!this.#isNonEmptyString(userId)) {
      throw new Error('userId must be a non-empty string');
    }

    if (onPasswordRehashRequired && typeof onPasswordRehashRequired !== 'function') {
      throw new Error('onPasswordRehashRequired must be a function');
    }

    this.#username = username;
    this.#passwordHash = this.#isNonEmptyString(passwordHash) ? passwordHash : hashPassword(password);
    this.#userId = userId;
    this.#onPasswordRehashRequired = onPasswordRehashRequired || null;
  }

  async execute({ username, password } = {}) {
    if (username !== this.#username || !this.#isNonEmptyString(password)) {
      return null;
    }

    const verification = verifyPassword({
      password,
      storedHash: this.#passwordHash,
    });

    if (!verification.verified) {
      return null;
    }

    if (verification.needsRehash && this.#onPasswordRehashRequired) {
      await this.#onPasswordRehashRequired({
        userId: this.#userId,
        username: this.#username,
        legacyFormat: verification.format,
        legacyHash: this.#passwordHash,
        upgradedHash: verification.newHash,
      });
    }

    return this.#userId;
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }
}

module.exports = StaticLoginAuthenticator;
