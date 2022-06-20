const characters = require('../../../src/handlers/characters');

describe('unit characters', () => {
  it('characters', async () => {
    const req = {};
    const res = {
      render: jest.fn(),
    };

    await characters(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0]).toEqual(['pages/characters']);
  });
});