const IUserRepository = require('../../../../src/application/user/port/IUserRepository');

module.exports = class MockUserRepository extends IUserRepository {
  constructor() {
    super();

    [
      'save',
      'findByUserId',
    ].forEach(propertyName => {
      if (!(propertyName in this)) {
        throw new Error();
      }
      this[propertyName] = jest.fn();
    });
  }
};
