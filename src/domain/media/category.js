const ignoreCharactersReg = /[\x00-\x1F\x7F]/;

module.exports = class Category {
  #value;
  constructor(value) {
    if (ignoreCharactersReg.test(value)) {
      throw new Error();
    }
    this.#value = value;
  }
  getValue() {
    return this.#value;
  }
  equals(other) {
    return other instanceof Category && this.#value === other.getValue();
  }
}