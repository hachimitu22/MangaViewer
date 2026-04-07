const setRouterApiLogout = require('../../../../../src/controller/router/user/setRouterApiLogout');

describe('setRouterApiLogout', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
      clearCookie: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  it('POST /api/logout に認証付きログアウトコントローラーを登録できる', async () => {
    const router = { post: jest.fn() };
    const authResolver = { execute: jest.fn().mockResolvedValue('user-1') };
    const logoutService = { execute: jest.fn().mockResolvedValue({ code: 0 }) };

    setRouterApiLogout({ router, authResolver, logoutService });

    expect(router.post).toHaveBeenCalledTimes(1);
    const [path, middleware, handler] = router.post.mock.calls[0];
    expect(path).toBe('/api/logout');
    expect(typeof middleware).toBe('function');
    expect(typeof handler).toBe('function');

    const req = {
      session: { session_token: 'token-1' },
      context: {},
    };
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    await handler(req, res);
    expect(logoutService.execute).toHaveBeenCalledTimes(1);
    expect(res.clearCookie).toHaveBeenCalledWith('session_token', expect.objectContaining({
      path: '/',
      sameSite: 'lax',
      secure: false,
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('logoutServiceが不正な場合は初期化時に例外となる', () => {
    expect(() => setRouterApiLogout({
      router: { post: jest.fn() },
      authResolver: { execute: jest.fn() },
      logoutService: {},
    })).toThrow('logoutService.execute must be a function');
  });
});
