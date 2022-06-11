const characters = require('../../../src/handlers/characters');

describe('unit characters', () => {
  it('characters', async () => {
    const req = {};
    const res = {
      send: jest.fn(),
    };

    await characters(req, res);

    expect(res.send.mock.calls.length).toBe(1);
    expect(res.send.mock.calls[0]).toEqual(['characters']);
  });
});