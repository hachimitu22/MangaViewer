class InMemorySessionStateStore {
  #clock;

  #sessions;

  constructor({
    clock = () => Date.now(),
  } = {}) {
    this.#clock = clock;
    this.#sessions = new Map();
  }

  save({
    sessionToken,
    userId,
    ttlMs,
  }) {
    this.#validateSessionToken(sessionToken);
    this.#validateUserId(userId);
    this.#validateTtlMs(ttlMs);

    const expiresAt = this.#clock() + ttlMs;
    this.#sessions.set(sessionToken, {
      userId,
      expiresAt,
    });

    return {
      sessionToken,
      userId,
      expiresAt,
    };
  }

  findUserIdBySessionToken(sessionToken) {
    this.#validateSessionToken(sessionToken);
    this.purgeExpired();

    return this.#sessions.get(sessionToken)?.userId;
  }

  delete(sessionToken) {
    this.#validateSessionToken(sessionToken);

    return this.#sessions.delete(sessionToken);
  }

  purgeExpired() {
    const now = this.#clock();
    for (const [sessionToken, sessionState] of this.#sessions.entries()) {
      if (sessionState.expiresAt <= now) {
        this.#sessions.delete(sessionToken);
      }
    }
  }

  #validateSessionToken(sessionToken) {
    if (!this.#isNonEmptyString(sessionToken)) {
      throw new Error('sessionToken must be a non-empty string');
    }
  }

  #validateUserId(userId) {
    if (!this.#isNonEmptyString(userId)) {
      throw new Error('userId must be a non-empty string');
    }
  }

  #validateTtlMs(ttlMs) {
    if (!Number.isInteger(ttlMs) || ttlMs <= 0) {
      throw new Error('ttlMs must be a positive integer');
    }
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }
}

module.exports = InMemorySessionStateStore;
