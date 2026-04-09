const setRouterApiLogin = require('../../../../../src/controller/router/user/setRouterApiLogin');

describe('setRouterApiLogin', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const createLoginAttemptStore = () => ({
    consumeRateLimit: jest.fn()
      .mockReturnValueOnce({ count: 1, resetAtMs: Date.now() + 60_000 })
      .mockReturnValueOnce({ count: 1, resetAtMs: Date.now() + 60_000 }),
    getTemporaryLockState: jest.fn().mockReturnValue({ isLocked: false, failureCount: 0, lockUntilMs: 0 }),
    recordAuthenticationFailure: jest.fn(),
    clearAuthenticationFailures: jest.fn(),
    clearRateLimit: jest.fn(),
  });

  it('POST /api/login にRateLimiterとログインコントローラーを登録できる', async () => {
    const router = { post: jest.fn() };
    const loginService = {
      execute: jest.fn().mockResolvedValue({ code: 0, sessionToken: 'token-1', constructor: { name: 'LoginSucceededResult' } }),
    };
    const loginAttemptStore = createLoginAttemptStore();

    setRouterApiLogin({ router, loginService, loginAttemptStore });

    expect(router.post).toHaveBeenCalledTimes(1);
    const [path, rateLimiter, csrf, handler] = router.post.mock.calls[0];
    expect(path).toBe('/api/login');
    expect(typeof rateLimiter).toBe('function');
    expect(typeof csrf).toBe('function');
    expect(typeof handler).toBe('function');

    const req = {
      ip: '127.0.0.1',
      method: 'POST',
      path: '/api/login',
      body: { username: 'admin', password: 'secret' },
      session: { regenerate: jest.fn(), csrf_token: 'csrf-token' },
      get: jest.fn((name) => {
        const headers = {
          'x-csrf-token': 'csrf-token',
          origin: 'http://localhost',
          host: 'localhost',
        };
        return headers[String(name).toLowerCase()] ?? headers[name];
      }),
      protocol: 'http',
      app: {
        locals: {
          dependencies: {
            logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
          },
        },
      },
      context: {},
    };
    const res = createRes();

    await rateLimiter(req, res, async () => {
      await csrf(req, res, async () => {
        await handler(req, res);
      });
    });

    expect(loginService.execute).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('loginServiceが不正な場合は初期化時に例外となる', () => {
    expect(() => setRouterApiLogin({
      router: { post: jest.fn() },
      loginService: {},
      loginAttemptStore: createLoginAttemptStore(),
    })).toThrow('loginService.execute must be a function');
  });
});
