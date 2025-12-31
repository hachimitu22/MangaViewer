const MediaId = require('../media/mediaId');

module.exports = class Queue {
  #mediaId;
  constructor(mediaId) {
    if (!(mediaId instanceof MediaId)) {
      throw new Error();
    }

    this.#mediaId = mediaId;
  }
  getMediaId() {
    return this.#mediaId;
  }
  equals(other) {
    return other instanceof Queue &&
      this.#mediaId.equals(other.getMediaId());
  }
}