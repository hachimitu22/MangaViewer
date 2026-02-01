const IMediaRepository = require('../../../../src/application/media/port/IMediaRepository');

module.exports = class MockMediaRepository extends IMediaRepository {
  constructor() {
    super();

    [
      'save',
      'findByMediaId',
      'delete',
    ].forEach(propertyName => {
      if (!(propertyName in this)) {
        throw new Error();
      }
      this[propertyName] = jest.fn();
    });
  }
};
