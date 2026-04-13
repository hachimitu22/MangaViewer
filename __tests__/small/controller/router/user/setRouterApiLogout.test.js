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
    const [path, authMiddleware, csrfMiddleware, handler] = router.post.mock.calls[0];
    expect(path).toBe('/api/logout');
    expect(typeof authMiddleware).toBe('function');
    expect(typeof csrfMiddleware).toBe('function');
    expect(typeof handler).toBe('function');

    const req = {
      session: { session_token: 'token-1', csrf_token: 'csrf-1' },
      context: {},
      protocol: 'http',
      get: name => ({
        'x-csrf-token': 'csrf-1',
        origin: 'http://localhost',
        host: 'localhost',
      }[String(name).toLowerCase()] || undefined),
    };
    const res = createRes();
    const next = jest.fn();

    await authMiddleware(req, res, next);
    await csrfMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);

    await handler(req, res);
    expect(logoutService.execute).toHaveBeenCalledTimes(1);
    expect(res.clearCookie).toHaveBeenCalledWith('session_token', expect.objectContaining({
      path: '/',
      sameSite: 'lax',
      secure: false,
    }));
    expect(res.clearCookie).toHaveBeenCalledWith('csrf_token', expect.objectContaining({
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
