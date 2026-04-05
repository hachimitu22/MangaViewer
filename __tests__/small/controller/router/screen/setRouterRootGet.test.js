const setRouterRootGet = require('../../../../../src/controller/router/screen/setRouterRootGet');

describe('setRouterRootGet', () => {
  it('GET / にハンドラーを登録できる', () => {
    const router = {
      get: jest.fn(),
    };

    setRouterRootGet({
      router,
      authResolver: {
        execute: jest.fn(),
      },
    });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [path, handler] = router.get.mock.calls[0];
    expect(path).toBe('/');
    expect(typeof handler).toBe('function');
  });

  it('token 未設定なら /screen/login へリダイレクトする', async () => {
    const router = {
      get: jest.fn(),
    };
    const authResolver = {
      execute: jest.fn(),
    };

    setRouterRootGet({ router, authResolver });

    const [, handler] = router.get.mock.calls[0];
    const req = {
      session: {},
    };
    const res = {
      redirect: jest.fn(),
    };

    await handler(req, res);

    expect(authResolver.execute).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/screen/login');
  });

  it('解決失敗時は /screen/login へリダイレクトする', async () => {
    const router = {
      get: jest.fn(),
    };
    const authResolver = {
      execute: jest.fn().mockResolvedValue(null),
    };

    setRouterRootGet({ router, authResolver });

    const [, handler] = router.get.mock.calls[0];
    const req = {
      session: {
        session_token: 'token-1',
      },
    };
    const res = {
      redirect: jest.fn(),
    };

    await handler(req, res);

    expect(authResolver.execute).toHaveBeenCalledWith('token-1');
    expect(res.redirect).toHaveBeenCalledWith('/screen/login');
  });

  it('例外発生時は /screen/login へリダイレクトする', async () => {
    const router = {
      get: jest.fn(),
    };
    const authResolver = {
      execute: jest.fn().mockRejectedValue(new Error('auth error')),
    };

    setRouterRootGet({ router, authResolver });

    const [, handler] = router.get.mock.calls[0];
    const req = {
      session: {
        session_token: 'token-1',
      },
    };
    const res = {
      redirect: jest.fn(),
    };

    await handler(req, res);

    expect(authResolver.execute).toHaveBeenCalledWith('token-1');
    expect(res.redirect).toHaveBeenCalledWith('/screen/login');
  });

  it('認証成功時は /screen/summary へリダイレクトする', async () => {
    const router = {
      get: jest.fn(),
    };
    const authResolver = {
      execute: jest.fn().mockResolvedValue('user-001'),
    };

    setRouterRootGet({ router, authResolver });

    const [, handler] = router.get.mock.calls[0];
    const req = {
      session: {
        session_token: 'token-1',
      },
    };
    const res = {
      redirect: jest.fn(),
    };

    await handler(req, res);

    expect(authResolver.execute).toHaveBeenCalledWith('token-1');
    expect(res.redirect).toHaveBeenCalledWith('/screen/summary');
  });
});
