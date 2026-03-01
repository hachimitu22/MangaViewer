const IMediaIdValueGenerator = require('../../../../src/domain/media/IMediaIdValueGenerator');

module.exports = class MockMediaIdValueGenerator extends IMediaIdValueGenerator {
  constructor() {
    super();
    this.generate = jest.fn();
  }
};
