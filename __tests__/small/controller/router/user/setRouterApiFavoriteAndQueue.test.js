const setRouterApiFavoriteAndQueue = require('../../../../../src/controller/router/user/setRouterApiFavoriteAndQueue');

describe('setRouterApiFavoriteAndQueue', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const createRequest = (mediaId = 'media-1') => ({
    params: { mediaId },
    session: { session_token: 'token-1' },
    context: {},
  });

  const executeRegisteredRoute = async ({ middleware, handler, req, res, next = jest.fn() }) => {
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    await handler(req, res, next);
    return next;
  };

  it('favorite / queue の各ルートに認証付きハンドラーを登録できる', () => {
    const router = { put: jest.fn(), post: jest.fn(), delete: jest.fn() };

    setRouterApiFavoriteAndQueue({
      router,
      authResolver: { execute: jest.fn() },
      addFavoriteService: { execute: jest.fn() },
      removeFavoriteService: { execute: jest.fn() },
      addQueueService: { execute: jest.fn() },
      removeQueueService: { execute: jest.fn() },
    });

    expect(router.put).toHaveBeenCalledTimes(2);
    expect(router.post).toHaveBeenCalledTimes(1);
    expect(router.delete).toHaveBeenCalledTimes(2);

    expect(router.put.mock.calls[0][0]).toBe('/api/favorite/:mediaId');
    expect(router.delete.mock.calls[0][0]).toBe('/api/favorite/:mediaId');
    expect(router.put.mock.calls[1][0]).toBe('/api/queue/:mediaId');
    expect(router.post.mock.calls[0][0]).toBe('/api/queue/:mediaId');
    expect(router.delete.mock.calls[1][0]).toBe('/api/queue/:mediaId');

    [...router.put.mock.calls, ...router.post.mock.calls, ...router.delete.mock.calls].forEach(([, middleware, handler]) => {
      expect(typeof middleware).toBe('function');
      expect(typeof handler).toBe('function');
    });
  });

  it('favorite の PUT / DELETE で対応サービスを呼び出せる', async () => {
    const router = { put: jest.fn(), post: jest.fn(), delete: jest.fn() };
    const authResolver = { execute: jest.fn().mockResolvedValue('user-1') };
    const addFavoriteService = { execute: jest.fn().mockResolvedValue(undefined) };
    const removeFavoriteService = { execute: jest.fn().mockResolvedValue(undefined) };

    setRouterApiFavoriteAndQueue({
      router,
      authResolver,
      addFavoriteService,
      removeFavoriteService,
      addQueueService: { execute: jest.fn() },
      removeQueueService: { execute: jest.fn() },
    });

    const [, favoritePutMiddleware, favoritePutHandler] = router.put.mock.calls[0];
    const putReq = createRequest('media-put');
    const putRes = createRes();
    await executeRegisteredRoute({ middleware: favoritePutMiddleware, handler: favoritePutHandler, req: putReq, res: putRes });

    expect(authResolver.execute).toHaveBeenCalledWith('token-1');
    expect(addFavoriteService.execute).toHaveBeenCalledWith(expect.objectContaining({
      mediaId: 'media-put',
      userId: 'user-1',
    }));
    expect(putRes.status).toHaveBeenCalledWith(200);
    expect(putRes.json).toHaveBeenCalledWith({ code: 0 });

    const [, favoriteDeleteMiddleware, favoriteDeleteHandler] = router.delete.mock.calls[0];
    const deleteReq = createRequest('media-delete');
    const deleteRes = createRes();
    await executeRegisteredRoute({ middleware: favoriteDeleteMiddleware, handler: favoriteDeleteHandler, req: deleteReq, res: deleteRes });

    expect(removeFavoriteService.execute).toHaveBeenCalledWith(expect.objectContaining({
      mediaId: 'media-delete',
      userId: 'user-1',
    }));
    expect(deleteRes.status).toHaveBeenCalledWith(200);
    expect(deleteRes.json).toHaveBeenCalledWith({ code: 0 });
  });

  it('queue の PUT / POST / DELETE で対応サービスを呼び出せる', async () => {
    const router = { put: jest.fn(), post: jest.fn(), delete: jest.fn() };
    const authResolver = { execute: jest.fn().mockResolvedValue('user-1') };
    const addQueueService = { execute: jest.fn().mockResolvedValue(undefined) };
    const removeQueueService = { execute: jest.fn().mockResolvedValue(undefined) };

    setRouterApiFavoriteAndQueue({
      router,
      authResolver,
      addFavoriteService: { execute: jest.fn() },
      removeFavoriteService: { execute: jest.fn() },
      addQueueService,
      removeQueueService,
    });

    const [, queuePutMiddleware, queuePutHandler] = router.put.mock.calls[1];
    const putReq = createRequest('queue-put');
    const putRes = createRes();
    await executeRegisteredRoute({ middleware: queuePutMiddleware, handler: queuePutHandler, req: putReq, res: putRes });

    const [, queuePostMiddleware, queuePostHandler] = router.post.mock.calls[0];
    const postReq = createRequest('queue-post');
    const postRes = createRes();
    await executeRegisteredRoute({ middleware: queuePostMiddleware, handler: queuePostHandler, req: postReq, res: postRes });

    const [, queueDeleteMiddleware, queueDeleteHandler] = router.delete.mock.calls[1];
    const deleteReq = createRequest('queue-delete');
    const deleteRes = createRes();
    await executeRegisteredRoute({ middleware: queueDeleteMiddleware, handler: queueDeleteHandler, req: deleteReq, res: deleteRes });

    expect(addQueueService.execute).toHaveBeenNthCalledWith(1, expect.objectContaining({ mediaId: 'queue-put', userId: 'user-1' }));
    expect(addQueueService.execute).toHaveBeenNthCalledWith(2, expect.objectContaining({ mediaId: 'queue-post', userId: 'user-1' }));
    expect(removeQueueService.execute).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'queue-delete', userId: 'user-1' }));
    expect(deleteRes.json).toHaveBeenCalledWith({ code: 0 });
  });

  it('サービス呼び出し時の例外を next に委譲する', async () => {
    const router = { put: jest.fn(), post: jest.fn(), delete: jest.fn() };
    const expectedError = new Error('failed');

    setRouterApiFavoriteAndQueue({
      router,
      authResolver: { execute: jest.fn().mockResolvedValue('user-1') },
      addFavoriteService: { execute: jest.fn().mockRejectedValue(expectedError) },
      removeFavoriteService: { execute: jest.fn() },
      addQueueService: { execute: jest.fn() },
      removeQueueService: { execute: jest.fn() },
    });

    const [, middleware, handler] = router.put.mock.calls[0];
    const req = createRequest('media-error');
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);
    await handler(req, res, next);

    expect(next).toHaveBeenNthCalledWith(1);
    expect(next).toHaveBeenNthCalledWith(2, expectedError);
  });
});
