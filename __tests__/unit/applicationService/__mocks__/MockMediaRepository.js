const IMediaRepository = require('../../../../src/application/media/port/IMediaRepository');

module.exports = class MockMediaRepository extends IMediaRepository {
  constructor() {
    super();
    this.save = jest.fn();
  }
};
