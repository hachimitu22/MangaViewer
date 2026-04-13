module.exports = class ContentId {
  #id;
  constructor(id) {
    this.#id = id;
  }
  getId() {
    return this.#id;
  }
  equals(other) {
    return other instanceof ContentId && this.#id === other.getId();
  }
}