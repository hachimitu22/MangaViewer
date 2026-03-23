const ejs = require('ejs');
const path = require('path');
const setRouterScreenDetailGet = require('../../../../../src/controller/router/screen/setRouterScreenDetailGet');

describe('setRouterScreenDetailGet', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      render: jest.fn(),
      redirect: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  it('GET /screen/detail/:mediaId に認証・描画ハンドラーを登録できる', async () => {
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
          registeredAt: '2026-03-20 12:34 UTC',
          contents: [{ id: 'content-1', thumbnail: 'content-1', position: 1 }],
          tags: [{ category: '作者', label: '山田' }],
          priorityCategories: ['作者'],
        },
      }),
    };

    setRouterScreenDetailGet({ router, authResolver, getMediaDetailService });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [pathPattern, ...handlers] = router.get.mock.calls[0];
    expect(pathPattern).toBe('/screen/detail/:mediaId');
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
    expect(getMediaDetailService.execute).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'media-1' }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('screen/detail', expect.objectContaining({
      pageTitle: '作品タイトル の詳細',
      mediaDetail: expect.objectContaining({
        id: 'media-1',
        registeredAt: '2026-03-20 12:34 UTC',
      }),
    }));
  });

  it('詳細テンプレートにタグリンク・登録日・サムネイル導線を渡せる', async () => {
    const templatePath = path.join(process.cwd(), 'src', 'views', 'screen', 'detail.ejs');
    const html = await ejs.renderFile(templatePath, {
      pageTitle: '作品タイトル の詳細',
      mediaDetail: {
        id: 'media-1',
        title: '作品タイトル',
        registeredAt: '2026-03-20 12:34 UTC',
        contents: [
          { id: 'content-1', thumbnail: 'content-1', position: 1 },
          { id: '', thumbnail: '', position: 2 },
        ],
        tags: [{ category: '作者', label: '山田 太郎' }],
        priorityCategories: ['作者'],
      },
    });

    expect(html).toContain('登録日:');
    expect(html).toContain('2026-03-20 12:34 UTC');
    expect(html).toContain('/screen/summary?summaryPage=1&sort=date_asc&tags=%E4%BD%9C%E8%80%85%3A%E5%B1%B1%E7%94%B0%20%E5%A4%AA%E9%83%8E');
    expect(html).toContain('/screen/viewer/media-1/1');
    expect(html).toContain('alt="作品タイトル 1 枚目のサムネイル"');
    expect(html).toContain('サムネイル未設定');
  });
});
