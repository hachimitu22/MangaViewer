const IMediaQueryRepository = require('../../../../src/application/media/port/IMediaQueryRepository');

module.exports = class MockMediaQueryRepository extends IMediaQueryRepository {
  constructor() {
    super();

    [
      'search',
    ].forEach(propertyName => {
      if (!(propertyName in this)) {
        throw new Error();
      }
      this[propertyName] = jest.fn();
    });
  }
};
