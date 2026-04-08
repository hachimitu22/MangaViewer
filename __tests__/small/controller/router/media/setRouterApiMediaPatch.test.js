const setRouterApiMediaPatch = require('../../../../../src/controller/router/media/setRouterApiMediaPatch');

describe('setRouterApiMediaPatch', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const createReq = () => ({
    session: {
      session_token: 'token-1',
      csrf_token: 'csrf-1',
    },
    protocol: 'http',
    get: name => ({
      'x-csrf-token': 'csrf-1',
      origin: 'http://localhost',
      host: 'localhost',
    }[String(name).toLowerCase()] || undefined),
    params: {
      mediaId: 'media-1',
    },
    body: {
      title: 'updated title',
      tags: [
        { category: '作者', label: '山田' },
        { category: 'ジャンル', label: 'バトル' },
      ],
    },
    context: {},
  });

  it('PATCH /api/media/:mediaId に認証・保存・更新の順でハンドラーを登録できる', async () => {
    const router = { patch: jest.fn() };
    const authResolver = { execute: jest.fn().mockResolvedValue('u1') };
    const saveAdapter = {
      execute: jest.fn((req, _res, cb) => {
        req.context.contentIds = ['c2', 'c1'];
        cb();
      }),
    };
    const updateMediaService = { execute: jest.fn().mockResolvedValue(undefined) };

    setRouterApiMediaPatch({
      router,
      authResolver,
      saveAdapter,
      updateMediaService,
    });

    expect(router.patch).toHaveBeenCalledTimes(1);
    const [path, ...handlers] = router.patch.mock.calls[0];
    expect(path).toBe('/api/media/:mediaId');
    expect(handlers).toHaveLength(4);

    const req = createReq();
    const res = createRes();

    await handlers[0](req, res, async () => {
      await handlers[1](req, res, async () => {
        await handlers[2](req, res, async () => {
          await handlers[3](req, res);
        });
      });
    });

    expect(authResolver.execute).toHaveBeenCalledWith('token-1');
    expect(saveAdapter.execute).toHaveBeenCalledWith(req, res, expect.any(Function));
    expect(updateMediaService.execute).toHaveBeenCalledWith(expect.objectContaining({
      id: 'media-1',
      title: 'updated title',
      contents: ['c2', 'c1'],
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 0 });
  });
});
