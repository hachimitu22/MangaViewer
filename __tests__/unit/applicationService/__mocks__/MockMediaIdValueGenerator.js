const IMediaIdValueGenerator = require('../../../../src/application/media/port/IMediaIdValueGenerator');

module.exports = class MockMediaIdValueGenerator extends IMediaIdValueGenerator {
  constructor() {
    super();
    this.generate = jest.fn();
  }
};
