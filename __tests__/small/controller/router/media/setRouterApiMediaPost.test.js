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
    session: {
      session_token: 'token-1',
    },
    body: {
      title: 'sample title',
      contents: [
        { file: { name: '2.png' }, position: 2 },
        { file: { name: '1.png' }, position: 1 },
      ],
      tags: [
        { category: '作者', label: '山田' },
        { category: 'ジャンル', label: 'バトル' },
      ],
    },
  });

  it('POST /api/media に認証・保存・登録の順でハンドラーを登録できる', async () => {
    const router = {
      post: jest.fn(),
    };
    const authResolver = {
      execute: jest.fn().mockResolvedValue('u1'),
    };
    const saveResolver = {
      execute: jest.fn().mockResolvedValue(['c1', 'c2']),
    };
    const mediaIdValueGenerator = {
      generate: jest.fn().mockReturnValue('m1'),
    };
    const mediaRepository = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    setRouterApiMediaPost({
      router,
      authResolver,
      saveResolver,
      mediaIdValueGenerator,
      mediaRepository,
    });

    expect(router.post).toHaveBeenCalledTimes(1);
    const [path, ...handlers] = router.post.mock.calls[0];
    expect(path).toBe('/api/media');
    expect(handlers).toHaveLength(3);

    const req = createReq();
    const res = createRes();

    await handlers[0](req, res, async () => {
      await handlers[1](req, res, async () => {
        await handlers[2](req, res);
      });
    });

    expect(authResolver.execute).toHaveBeenCalledTimes(1);
    expect(authResolver.execute).toHaveBeenCalledWith('token-1');

    expect(saveResolver.execute).toHaveBeenCalledTimes(1);
    expect(saveResolver.execute).toHaveBeenCalledWith([
      { file: { name: '1.png' }, position: 1 },
      { file: { name: '2.png' }, position: 2 },
    ]);

    expect(mediaIdValueGenerator.generate).toHaveBeenCalledTimes(1);
    expect(mediaRepository.save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      code: 0,
      mediaId: 'm1',
    });
  });

  it('authResolverが不正な場合は初期化時に例外となる', () => {
    const router = {
      post: jest.fn(),
    };

    expect(() => {
      setRouterApiMediaPost({
        router,
        authResolver: {},
        saveResolver: { execute: jest.fn() },
        mediaIdValueGenerator: { generate: jest.fn().mockReturnValue('m1') },
        mediaRepository: { save: jest.fn() },
      });
    }).toThrow();
  });

  it('saveResolverが不正な場合は初期化時に例外となる', () => {
    const router = {
      post: jest.fn(),
    };

    expect(() => {
      setRouterApiMediaPost({
        router,
        authResolver: { execute: jest.fn().mockResolvedValue('u1') },
        saveResolver: {},
        mediaIdValueGenerator: { generate: jest.fn().mockReturnValue('m1') },
        mediaRepository: { save: jest.fn() },
      });
    }).toThrow();
  });
});
