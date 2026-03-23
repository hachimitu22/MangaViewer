const setRouterApiMediaDelete = require('../../../../../src/controller/router/media/setRouterApiMediaDelete');

describe('setRouterApiMediaDelete', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  it('DELETE /api/media/:mediaId に認証・削除の順でハンドラーを登録できる', async () => {
    const router = { delete: jest.fn() };
    const authResolver = { execute: jest.fn().mockResolvedValue('u1') };
    const deleteMediaService = { execute: jest.fn().mockResolvedValue(undefined) };

    setRouterApiMediaDelete({
      router,
      authResolver,
      deleteMediaService,
    });

    expect(router.delete).toHaveBeenCalledTimes(1);
    const [path, ...handlers] = router.delete.mock.calls[0];
    expect(path).toBe('/api/media/:mediaId');
    expect(handlers).toHaveLength(2);

    const req = {
      session: { session_token: 'token-1' },
      params: { mediaId: 'media-1' },
      context: {},
    };
    const res = createRes();

    await handlers[0](req, res, async () => {
      await handlers[1](req, res);
    });

    expect(authResolver.execute).toHaveBeenCalledWith('token-1');
    expect(deleteMediaService.execute).toHaveBeenCalledWith(expect.objectContaining({
      id: 'media-1',
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 0 });
  });
});
