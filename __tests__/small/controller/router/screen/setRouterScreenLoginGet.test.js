const setRouterScreenLoginGet = require('../../../../../src/controller/router/screen/setRouterScreenLoginGet');

describe('setRouterScreenLoginGet', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      render: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  it('GET /screen/login に描画ハンドラーを登録できる', () => {
    const router = {
      get: jest.fn(),
    };

    setRouterScreenLoginGet({ router });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [path, handler] = router.get.mock.calls[0];
    expect(path).toBe('/screen/login');
    expect(typeof handler).toBe('function');

    const res = createRes();
    handler({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('screen/login', {
      pageTitle: 'ログイン',
      formAction: '/api/login',
      usernameLabel: 'ユーザー名',
      passwordLabel: 'パスワード',
      submitLabel: 'ログイン',
    });
  });
});
