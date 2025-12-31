const MediaId = require('../media/mediaId');

module.exports = class Favorite {
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
    return other instanceof Favorite &&
      this.#mediaId.equals(other.getMediaId());
  }
}