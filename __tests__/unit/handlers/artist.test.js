const artist = require('../../../src/handlers/artist');

describe('unit artist', () => {
  it('artist', async () => {
    const req = {};
    const res = {
      render: jest.fn(),
    };

    await artist(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0]).toEqual(['pages/artist']);
  });
});