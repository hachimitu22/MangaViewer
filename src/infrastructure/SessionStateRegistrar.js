const { randomUUID } = require('crypto');

class SessionStateRegistrar {
  #sessionStateStore;

  #sessionTokenGenerator;

  constructor({
    sessionStateStore,
    sessionTokenGenerator = () => randomUUID().replace(/-/g, ''),
  } = {}) {
    if (!sessionStateStore || typeof sessionStateStore.save !== 'function') {
      throw new Error('sessionStateStore.save must be a function');
    }

    if (typeof sessionTokenGenerator !== 'function') {
      throw new Error('sessionTokenGenerator must be a function');
    }

    this.#sessionStateStore = sessionStateStore;
    this.#sessionTokenGenerator = sessionTokenGenerator;
  }

  async execute({
    session,
    userId,
    ttlMs,
  }) {
    if (!session || typeof session !== 'object') {
      throw new Error('session must be an object');
    }

    if (!this.#isNonEmptyString(userId)) {
      throw new Error('userId must be a non-empty string');
    }

    const sessionToken = this.#sessionTokenGenerator();
    if (!this.#isNonEmptyString(sessionToken)) {
      throw new Error('sessionToken must be a non-empty string');
    }

    const sessionState = await this.#sessionStateStore.save({
      sessionToken,
      userId,
      ttlMs,
    });

    session.session_token = sessionToken;

    return sessionState;
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }
}

module.exports = SessionStateRegistrar;
