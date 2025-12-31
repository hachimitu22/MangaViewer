const ignoreCharactersReg = /[\x00-\x1F\x7F]/;

module.exports = class Label {
  #label;
  constructor(label) {
    if (ignoreCharactersReg.test(label)) {
      throw new Error();
    }
    this.#label = label;
  }
  getLabel() {
    return this.#label;
  }
  equals(other) {
    return other instanceof Label && this.#label === other.getLabel();
  }
}