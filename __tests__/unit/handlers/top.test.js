const top = require('../../../src/handlers/top');

it('unit top', async () => {
  const req = {};
  const res = {
    render: jest.fn(),
  };

  await top(req, res);

  expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0]).toEqual(['pages/top']);
})