const setRouterApiMediaPost = require('../../../../../src/controller/router/media/setRouterApiMediaPost');

describe('setRouterApiMediaPost', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const createReq = () => ({
    protocol: 'http',
    get: name => ({
      'x-csrf-token': 'csrf-1',
      cookie: 'csrf_token=csrf-1',
      'x-admin-token': 'admin-token',
      origin: 'http://localhost',
      host: 'localhost',
    }[String(name).toLowerCase()] || undefined),
    body: {
      title: 'sample title',
      tags: [
        { category: '作者', label: '山田' },
        { category: 'ジャンル', label: 'バトル' },
      ],
    },
    context: {},
  });

  it('POST /api/media に認証・保存・登録の順でハンドラーを登録できる', async () => {
    const router = {
      post: jest.fn(),
    };
    const saveAdapter = {
      execute: jest.fn((req, _res, cb) => {
        req.context.contentIds = ['c1', 'c2'];
        cb();
      }),
    };
    const mediaIdValueGenerator = {
      generate: jest.fn().mockReturnValue('m1'),
    };
    const mediaRepository = {
      save: jest.fn().mockResolvedValue(undefined),
    };
    const unitOfWork = {
      run: jest.fn(async work => work()),
    };

    setRouterApiMediaPost({
      router,
      adminApiToken: 'admin-token',
      saveAdapter,
      mediaIdValueGenerator,
      mediaRepository,
      unitOfWork,
    });

    expect(router.post).toHaveBeenCalledTimes(1);
    const [path, ...handlers] = router.post.mock.calls[0];
    expect(path).toBe('/api/media');
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

        expect(saveAdapter.execute).toHaveBeenCalledTimes(1);
    expect(saveAdapter.execute).toHaveBeenCalledWith(req, res, expect.any(Function));

    expect(mediaIdValueGenerator.generate).toHaveBeenCalledTimes(1);
    expect(mediaRepository.save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 0,
      mediaId: 'm1',
    });
  });

  it('adminApiToken未設定のfail-closeで401となる', async () => {
    const router = {
      post: jest.fn(),
    };

    setRouterApiMediaPost({
      router,
      adminApiToken: '',
      saveAdapter: { execute: jest.fn() },
      mediaIdValueGenerator: { generate: jest.fn().mockReturnValue('m1') },
      mediaRepository: { save: jest.fn() },
      unitOfWork: { run: jest.fn(async work => work()) },
    });
    const [, authHandler] = router.post.mock.calls[0];
    const res = createRes();
    await authHandler(createReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('saveAdapterが不正な場合は初期化時に例外となる', () => {
    const router = {
      post: jest.fn(),
    };

    expect(() => {
      setRouterApiMediaPost({
        router,
        adminApiToken: 'admin-token',
        saveAdapter: {},
        mediaIdValueGenerator: { generate: jest.fn().mockReturnValue('m1') },
        mediaRepository: { save: jest.fn() },
        unitOfWork: { run: jest.fn(async work => work()) },
      });
    }).toThrow();
  });
});
