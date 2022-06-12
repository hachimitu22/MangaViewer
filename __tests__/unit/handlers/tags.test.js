const tags = require('../../../src/handlers/tags');

describe('unit tags', () => {
  it('tags', async () => {
    const req = {};
    const res = {
      render: jest.fn(),
    };

    await tags(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0]).toEqual(['pages/tags']);
  });
});