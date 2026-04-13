const Category = require('./category');
const Label = require('./label');

module.exports = class Tag {
  #category;
  #label;
  constructor(category, label) {
    if (!(category instanceof Category)) {
      throw new Error();
    }
    if (!(label instanceof Label)) {
      throw new Error();
    }

    this.#category = category;
    this.#label = label;
  }
  getCategory() {
    return this.#category;
  }
  getLabel() {
    return this.#label;
  }
  equals(other) {
    return other instanceof Tag &&
      this.#category.equals(other.getCategory()) &&
      this.#label.equals(other.getLabel());
  }
}