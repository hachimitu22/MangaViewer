const artists = require('../../../src/handlers/artists');

describe('unit artists', () => {
  it('artists', async () => {
    const req = {};
    const res = {
      render: jest.fn(),
    };

    await artists(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0]).toEqual(['pages/artists']);
  });
});