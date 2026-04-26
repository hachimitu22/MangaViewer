const setRouterScreenSearchGet = require('../../../../../src/controller/router/screen/setRouterScreenSearchGet');

describe('setRouterScreenSearchGet', () => {
  const createRes = () => { const res = { status: jest.fn(), json: jest.fn(), render: jest.fn() }; res.status.mockReturnValue(res); return res; };

  test('ルート登録時に描画ハンドラーを設定する', () => {
    const router = { get: jest.fn() };
    setRouterScreenSearchGet({ router });
    const [routePath, renderHandler] = router.get.mock.calls[0];
    expect(routePath).toBe('/screen/search');
    expect(typeof renderHandler).toBe('function');
  });

  test('描画ハンドラーは期待テンプレートと表示データを render する', () => {
    const router = { get: jest.fn() };
    setRouterScreenSearchGet({ router });
    const [, renderHandler] = router.get.mock.calls[0];
    const res = createRes();
    renderHandler({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
