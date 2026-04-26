const ejs = require('ejs');
const path = require('path');
const setRouterScreenDetailGet = require('../../../../../src/controller/router/screen/setRouterScreenDetailGet');

describe('setRouterScreenDetailGet', () => {
  const createRes = () => {
    const res = { status: jest.fn(), render: jest.fn(), redirect: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
  };

  it('GET /screen/detail/:mediaId に描画ハンドラーを登録できる', async () => {
    const router = { get: jest.fn() };
    const getMediaDetailService = { execute: jest.fn().mockResolvedValue({ mediaDetail: { id: 'media-1', title: '作品タイトル', registeredAt: '2026-03-20 12:34 UTC', contents: [{ id: 'content-1', thumbnail: 'content-1', position: 1 }], tags: [{ category: '作者', label: '山田' }], categories: ['作者'], priorityCategories: ['作者'] } }) };

    setRouterScreenDetailGet({ router, getMediaDetailService });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [pathPattern, handler] = router.get.mock.calls[0];
    expect(pathPattern).toBe('/screen/detail/:mediaId');
    expect(typeof handler).toBe('function');

    const req = { params: { mediaId: 'media-1' }, context: {} };
    const res = createRes();

    await handler(req, res, jest.fn());

    expect(getMediaDetailService.execute).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'media-1' }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('詳細テンプレートにカテゴリー・タグリンク・登録日・サムネイル導線を渡せる', async () => {
    const templatePath = path.join(process.cwd(), 'src', 'views', 'screen', 'detail.ejs');
    const html = await ejs.renderFile(templatePath, { pageTitle: '作品タイトル の詳細', mediaDetail: { id: 'media-1', title: '作品タイトル', registeredAt: '2026-03-20 12:34 UTC', contents: [{ id: 'content-1', thumbnail: 'content-1', position: 1 }, { id: '', thumbnail: '', position: 2 }], tags: [{ category: '作者', label: '山田 太郎' }, { category: '作者', label: '別名' }, { category: 'シリーズ', label: '作品群' }], categories: ['作者', 'シリーズ'], priorityCategories: ['作者'] } });
    expect(html).toContain('登録日:');
  });
});
