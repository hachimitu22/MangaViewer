const ignoreCharactersReg = /[\x00-\x1F\x7F]/;

module.exports = class MediaId {
  #id;
  constructor(id) {
    this.#id = id;
  }
  getId() {
    return this.#id;
  }
  equals(other) {
    return other instanceof MediaId && this.#id === other.getId();
  }
}