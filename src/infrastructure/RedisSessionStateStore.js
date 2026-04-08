class RedisSessionStateStore {
  #redis;

  #keyPrefix;

  constructor({ redis, keyPrefix = 'session' } = {}) {
    if (!redis || typeof redis.set !== 'function') {
      throw new Error('redis.set must be a function');
    }
    if (typeof redis.get !== 'function') {
      throw new Error('redis.get must be a function');
    }
    if (typeof redis.del !== 'function') {
      throw new Error('redis.del must be a function');
    }
    if (typeof keyPrefix !== 'string' || keyPrefix.length === 0) {
      throw new Error('keyPrefix must be a non-empty string');
    }

    this.#redis = redis;
    this.#keyPrefix = keyPrefix;
  }

  async save({ sessionToken, userId, ttlMs }) {
    this.#validateSessionToken(sessionToken);
    this.#validateUserId(userId);
    this.#validateTtlMs(ttlMs);

    await this.#redis.set(this.#sessionKey(sessionToken), userId, {
      PX: ttlMs,
    });

    return {
      sessionToken,
      userId,
      expiresAt: Date.now() + ttlMs,
    };
  }

  async findUserIdBySessionToken(sessionToken) {
    this.#validateSessionToken(sessionToken);

    const userId = await this.#redis.get(this.#sessionKey(sessionToken));
    return typeof userId === 'string' && userId.length > 0 ? userId : undefined;
  }

  async delete(sessionToken) {
    this.#validateSessionToken(sessionToken);

    const deletedCount = await this.#redis.del(this.#sessionKey(sessionToken));
    return deletedCount > 0;
  }

  #sessionKey(sessionToken) {
    return `${this.#keyPrefix}:${sessionToken}`;
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

module.exports = RedisSessionStateStore;
