const setRouterScreenSearchGet = require('../../../../../src/controller/router/screen/setRouterScreenSearchGet');

describe('setRouterScreenSearchGet', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
      render: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  test('ルート登録時に認証ガードと描画ハンドラーを設定する', async () => {
    const router = { get: jest.fn() };
    const authResolver = { execute: jest.fn().mockResolvedValue('user-001') };

    setRouterScreenSearchGet({ router, authResolver });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [routePath, authHandler, renderHandler] = router.get.mock.calls[0];
    expect(routePath).toBe('/screen/search');
    expect(typeof authHandler).toBe('function');
    expect(typeof renderHandler).toBe('function');

    const req = { session: { session_token: 'valid-token' }, context: {} };
    const res = createRes();
    const next = jest.fn();
    await authHandler(req, res, next);

    expect(authResolver.execute).toHaveBeenCalledWith('valid-token');
    expect(req.context.userId).toBe('user-001');
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('認証ガードは未認証時に401で後続描画を止める', async () => {
    const router = { get: jest.fn() };

    setRouterScreenSearchGet({
      router,
      authResolver: { execute: jest.fn() },
    });

    const [, authHandler] = router.get.mock.calls[0];
    const req = { session: {}, context: {} };
    const res = createRes();
    const next = jest.fn();

    await authHandler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '認証に失敗しました' });
  });

  test('描画ハンドラーは期待テンプレートと表示データを render する', () => {
    const router = { get: jest.fn() };

    setRouterScreenSearchGet({
      router,
      authResolver: { execute: jest.fn().mockResolvedValue('user-001') },
    });

    const [, , renderHandler] = router.get.mock.calls[0];
    const res = createRes();

    renderHandler({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('screen/search', {
      pageTitle: 'メディア検索',
      summaryPage: 1,
      categoryOptions: ['作者', 'ジャンル', 'シリーズ'],
      tagsByCategory: {
        作者: ['山田', '佐藤', '鈴木'],
        ジャンル: ['バトル', '恋愛', '日常'],
        シリーズ: ['第1部', '短編集'],
      },
      sortOptions: [
        { value: 'date_asc', label: '登録の新しい順' },
        { value: 'date_desc', label: '登録の古い順' },
        { value: 'title_asc', label: 'タイトル名の昇順' },
        { value: 'title_desc', label: 'タイトル名の降順' },
        { value: 'random', label: 'ランダム' },
      ],
    });
  });
});
