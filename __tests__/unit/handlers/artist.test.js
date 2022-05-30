const artist = require('../../../src/handlers/artist');

describe('unit artist', () => {
  it('artist', async () => {
    const req = {};
    const res = {
      send: jest.fn(),
    };

    await artist(req, res);

    expect(res.send.mock.calls.length).toBe(1);
    expect(res.send.mock.calls[0]).toEqual(['artist']);
  });
});