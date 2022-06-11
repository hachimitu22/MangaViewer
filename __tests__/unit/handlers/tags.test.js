const tags = require('../../../src/handlers/tags');

describe('unit tags', () => {
  it('tags', async () => {
    const req = {};
    const res = {
      send: jest.fn(),
    };

    await tags(req, res);

    expect(res.send.mock.calls.length).toBe(1);
    expect(res.send.mock.calls[0]).toEqual(['tags']);
  });
});