const setRouterRootGet = require('../../../../../src/controller/router/screen/setRouterRootGet');

describe('setRouterRootGet', () => {
  it('GET / にハンドラーを登録できる', () => {
    const router = { get: jest.fn() };

    setRouterRootGet({ router });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [path, handler] = router.get.mock.calls[0];
    expect(path).toBe('/');
    expect(typeof handler).toBe('function');
  });

  it('常に /screen/summary へリダイレクトする', async () => {
    const router = { get: jest.fn() };
    setRouterRootGet({ router });

    const [, handler] = router.get.mock.calls[0];
    const res = { redirect: jest.fn() };

    await handler({}, res);

    expect(res.redirect).toHaveBeenCalledWith('/screen/summary');
  });
});
