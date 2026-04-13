const setRouterScreenEntryGet = require('../../../../../src/controller/router/screen/setRouterScreenEntryGet');

describe('setRouterScreenEntryGet', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      render: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  it('GET /screen/entry に認証・描画ハンドラーを登録できる', async () => {
    const router = {
      get: jest.fn(),
    };
    const authResolver = {
      execute: jest.fn().mockResolvedValue('u1'),
    };

    setRouterScreenEntryGet({ router, authResolver });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [path, ...handlers] = router.get.mock.calls[0];
    expect(path).toBe('/screen/entry');
    expect(handlers).toHaveLength(2);

    const req = {
      session: {
        session_token: 'token-1',
      },
      context: {},
    };
    const res = createRes();

    await handlers[0](req, res, async () => {
      await handlers[1](req, res);
    });

    expect(authResolver.execute).toHaveBeenCalledWith('token-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('screen/entry', expect.objectContaining({
      pageTitle: 'メディア登録',
      currentPath: '/screen/entry',
      currentUserId: 'u1',
    }));
  });
});
