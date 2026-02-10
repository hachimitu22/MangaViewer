const IContentResult = require('./IContentResult');

module.exports = class NotFoundContent extends IContentResult {
  constructor({ position }) {
    super();

    if (typeof position !== 'number') {
      throw new Error();
    }

    this.position = position;
  }
}