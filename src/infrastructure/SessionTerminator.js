class SessionTerminator {
  #sessionStateStore;

  constructor({ sessionStateStore } = {}) {
    if (!sessionStateStore || typeof sessionStateStore.delete !== 'function') {
      throw new Error('sessionStateStore.delete must be a function');
    }

    this.#sessionStateStore = sessionStateStore;
  }

  async execute({ session } = {}) {
    if (!session || typeof session !== 'object') {
      throw new Error('session must be an object');
    }

    const sessionToken = session.session_token;
    if (!this.#isNonEmptyString(sessionToken)) {
      return false;
    }

    const deleted = await this.#sessionStateStore.delete(sessionToken);
    if (!deleted) {
      return false;
    }

    await this.#destroySession(session);
    return true;
  }

  #destroySession(session) {
    return new Promise((resolve, reject) => {
      if (typeof session.destroy !== 'function') {
        reject(new Error('session.destroy must be a function'));
        return;
      }

      session.destroy(error => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  #isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }
}

module.exports = SessionTerminator;
