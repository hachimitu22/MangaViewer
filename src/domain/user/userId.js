const ignoreCharactersReg = /[^a-zA-Z0-9]/;

module.exports = class UserId {
  #id;
  constructor(id) {
    if (ignoreCharactersReg.test(id)) {
      throw new Error();
    }

    this.#id = id;
  }
  getId() {
    return this.#id;
  }
  equals(other) {
    return other instanceof UserId && this.#id === other.getId();
  }
}