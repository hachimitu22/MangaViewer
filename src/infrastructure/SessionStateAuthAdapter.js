class SessionStateAuthAdapter {
  #sessionStateStore;

  constructor({
    sessionStateStore,
  } = {}) {
    if (!sessionStateStore || typeof sessionStateStore.findUserIdBySessionToken !== 'function') {
      throw new Error('sessionStateStore.findUserIdBySessionToken must be a function');
    }

    this.#sessionStateStore = sessionStateStore;
  }

  async execute(sessionToken) {
    return this.#sessionStateStore.findUserIdBySessionToken(sessionToken);
  }
}

module.exports = SessionStateAuthAdapter;
