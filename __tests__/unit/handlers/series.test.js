const series = require('../../../src/handlers/series');

describe('unit series', () => {
  it('series', async () => {
    const req = {};
    const res = {
      render: jest.fn(),
    };

    await series(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0]).toEqual(['pages/series']);
  });
});