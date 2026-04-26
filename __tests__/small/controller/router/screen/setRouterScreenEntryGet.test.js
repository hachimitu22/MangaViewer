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

  it('GET /screen/entry に描画ハンドラーを登録できる', async () => {
    const router = {
      get: jest.fn(),
    };

    setRouterScreenEntryGet({ router });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [path, ...handlers] = router.get.mock.calls[0];
    expect(path).toBe('/screen/entry');
    expect(handlers).toHaveLength(1);

    const req = {};
    const res = createRes();

    await handlers[0](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('screen/entry', expect.objectContaining({
      pageTitle: 'メディア登録',
      currentPath: '/screen/entry',
    }));
  });
});
