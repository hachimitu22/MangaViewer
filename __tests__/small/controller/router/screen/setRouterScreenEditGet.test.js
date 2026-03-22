const setRouterScreenEditGet = require('../../../../../src/controller/router/screen/setRouterScreenEditGet');

describe('setRouterScreenEditGet', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      render: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  it('GET /screen/edit/:mediaId に認証・描画ハンドラーを登録できる', async () => {
    const router = {
      get: jest.fn(),
    };
    const authResolver = {
      execute: jest.fn().mockResolvedValue('u1'),
    };
    const getMediaDetailService = {
      execute: jest.fn().mockResolvedValue({
        mediaDetail: {
          id: 'media-1',
          title: '作品タイトル',
          contents: ['content-1'],
          tags: [{ category: '作者', label: '山田' }],
          priorityCategories: ['作者'],
        },
      }),
    };

    setRouterScreenEditGet({ router, authResolver, getMediaDetailService });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [path, ...handlers] = router.get.mock.calls[0];
    expect(path).toBe('/screen/edit/:mediaId');
    expect(handlers).toHaveLength(2);

    const req = {
      params: { mediaId: 'media-1' },
      session: { session_token: 'token-1' },
      context: {},
    };
    const res = createRes();

    await handlers[0](req, res, async () => {
      await handlers[1](req, res, jest.fn());
    });

    expect(authResolver.execute).toHaveBeenCalledWith('token-1');
    expect(getMediaDetailService.execute).toHaveBeenCalledWith(expect.objectContaining({ id: 'media-1' }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('screen/edit', expect.objectContaining({
      pageTitle: '作品タイトル の編集',
      mediaDetail: expect.objectContaining({ id: 'media-1' }),
    }));
  });
});
