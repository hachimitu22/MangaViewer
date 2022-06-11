const series = require('../../../src/handlers/series');

describe('unit series', () => {
  it('series', async () => {
    const req = {};
    const res = {
      send: jest.fn(),
    };

    await series(req, res);

    expect(res.send.mock.calls.length).toBe(1);
    expect(res.send.mock.calls[0]).toEqual(['series']);
  });
});