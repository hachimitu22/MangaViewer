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

  it('POST /api/login にログインコントローラーを登録できる', async () => {
    const router = { post: jest.fn() };
    const loginService = {
      execute: jest.fn().mockResolvedValue({ code: 0, sessionToken: 'token-1', constructor: { name: 'LoginSucceededResult' } }),
    };

    setRouterApiLogin({ router, loginService });

    expect(router.post).toHaveBeenCalledTimes(1);
    const [path, handler] = router.post.mock.calls[0];
    expect(path).toBe('/api/login');
    expect(typeof handler).toBe('function');

    const req = {
      body: { username: 'admin', password: 'secret' },
      session: { regenerate: jest.fn() },
    };
    const res = createRes();

    await handler(req, res);

    expect(loginService.execute).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('loginServiceが不正な場合は初期化時に例外となる', () => {
    expect(() => setRouterApiLogin({ router: { post: jest.fn() }, loginService: {} }))
      .toThrow('loginService.execute must be a function');
  });
});
