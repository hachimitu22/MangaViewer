module.exports = class MockUnitOfWork {
  constructor() {
    this.run = jest.fn(async work => work());
    this.getCurrent = jest.fn(() => null);
  }
};
