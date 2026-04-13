const ignoreCharactersReg = /[\x00-\x1F\x7F]/;

module.exports = class MediaTitle {
  #title;
  constructor(title) {
    if (typeof title !== 'string' || title.trim() === '' || ignoreCharactersReg.test(title)) {
      throw new Error();
    }
    this.#title = title;
  }
  getTitle() {
    return this.#title;
  }
  equals(other) {
    return other instanceof MediaTitle && this.#title === other.getTitle();
  }
}
