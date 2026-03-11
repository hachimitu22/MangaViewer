const { AsyncLocalStorage } = require('async_hooks');

module.exports = class SequelizeUnitOfWork {
  #sequelize;
  #executionScopeStorage;

  constructor({ sequelize } = {}) {
    if (!sequelize || typeof sequelize.transaction !== 'function') {
      throw new Error();
    }

    this.#sequelize = sequelize;
    this.#executionScopeStorage = new AsyncLocalStorage();
  }

  async run(work) {
    if (typeof work !== 'function') {
      throw new Error();
    }

    return this.#sequelize.transaction(async executionScope => this.#executionScopeStorage.run(executionScope, work));
  }

  getCurrent() {
    return this.#executionScopeStorage.getStore() ?? null;
  }
};
