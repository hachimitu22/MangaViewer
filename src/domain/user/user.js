const UserId = require('./userId');
const MediaId = require('../media/mediaId');

module.exports = class User {
  #id;
  #favorites = [];
  #queue = [];
  constructor(id) {
    if (!(id instanceof UserId)) {
      throw new Error();
    }

    this.#id = id;
  }
  getUserId() {
    return this.#id;
  }
  addFavorite(mediaId) {
    this.#add(this.#favorites, mediaId);
  }
  removeFavorite(mediaId) {
    this.#remove(this.#favorites, mediaId);
  }
  getFavorites() {
    return this.#favorites;
  }
  addQueue(mediaId) {
    this.#add(this.#queue, mediaId);
  }
  removeQueue(mediaId) {
    this.#remove(this.#queue, mediaId);
  }
  getQueue() {
    return this.#queue;
  }

  #add(arr, mediaId) {
    if (!(mediaId instanceof MediaId)) {
      throw new Error();
    }
    if (arr.some(m => m.equals(mediaId))) {
      throw new Error();
    }
    arr.push(mediaId);
  }
  #remove(arr, mediaId) {
    const index = arr.findIndex(m => m.equals(mediaId));
    if (index === -1) {
      throw new Error();
    }
    arr.splice(index, 1);
  }
}