const AdminTokenAuthMiddleware = require('../../../../src/controller/middleware/AdminTokenAuthMiddleware');

describe('AdminTokenAuthMiddleware', () => {
  const createRes = () => {
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
  };

  test('x-admin-token が一致した場合は next へ委譲する', () => {
    const middleware = new AdminTokenAuthMiddleware({ expectedToken: 'admin-token' });
    const req = { get: jest.fn(name => (name.toLowerCase() === 'x-admin-token' ? 'admin-token' : undefined)) };
    const res = createRes();
    const next = jest.fn();
    middleware.execute(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('expectedToken 未設定時は fail-close で 401 を返す', () => {
    const middleware = new AdminTokenAuthMiddleware({ expectedToken: '' });
    const req = { get: jest.fn(() => undefined) };
    const res = createRes();
    middleware.execute(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
