const top = require('../../../src/handlers/top');

it('unit top', async () => {
  const req = {};
  const res = {
    send: jest.fn(),
  };

  await top(req, res);

  expect(res.send.mock.calls.length).toBe(1);
  expect(res.send.mock.calls[0]).toEqual(['top']);
})