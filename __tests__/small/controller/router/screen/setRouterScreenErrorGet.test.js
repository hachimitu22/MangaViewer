const setRouterScreenErrorGet = require('../../../../../src/controller/router/screen/setRouterScreenErrorGet');

describe('setRouterScreenErrorGet', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      render: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  it('GET /screen/error に描画ハンドラーを登録できる', () => {
    const router = {
      get: jest.fn(),
    };

    setRouterScreenErrorGet({ router });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [path, handler] = router.get.mock.calls[0];
    expect(path).toBe('/screen/error');
    expect(handler).toEqual(expect.any(Function));

    const res = createRes();
    handler({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('screen/error', expect.objectContaining({
      pageTitle: 'エラーが発生しました',
      errorTitle: 'ページを表示できませんでした',
      navigationLinks: expect.arrayContaining([
        expect.objectContaining({ href: '/screen/login' }),
        expect.objectContaining({ href: '/screen/summary' }),
      ]),
    }));
  });
});
