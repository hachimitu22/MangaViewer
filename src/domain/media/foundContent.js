const IContentResult = require('./IContentResult');
const ContentId = require('./contentId');

module.exports = class FoundContent extends IContentResult {
  constructor({ position, contentId }) {
    super();

    if (typeof position !== 'number') {
      throw new Error();
    }
    if (!(contentId instanceof ContentId)) {
      throw new Error();
    }

    this.position = position;
    this.contentId = contentId;
  }
}