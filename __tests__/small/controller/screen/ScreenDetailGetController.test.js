const ScreenDetailGetController = require('../../../../src/controller/screen/ScreenDetailGetController');

describe('ScreenDetailGetController', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      render: jest.fn(),
      redirect: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  test('mediaId を service に渡して詳細画面を描画する', async () => {
    const contentId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const mediaDetail = {
      id: 'media-1',
      title: '作品タイトル',
      registeredAt: '2026-03-20 12:34 UTC',
      contents: [{ id: 'content-1', thumbnail: contentId, position: 1 }],
      tags: [{ category: '作者', label: '山田' }],
      categories: ['作者'],
      priorityCategories: ['作者'],
    };
    const getMediaDetailService = {
      execute: jest.fn().mockResolvedValue({ mediaDetail }),
    };
    const controller = new ScreenDetailGetController({ getMediaDetailService });
    const req = { params: { mediaId: 'media-1' }, context: { userId: 'admin' } };
    const res = createRes();

    await controller.execute(req, res);

    expect(getMediaDetailService.execute).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'media-1' }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('screen/detail', {
      pageTitle: '作品タイトル の詳細',
      mediaDetail: {
        ...mediaDetail,
        contents: [{ id: 'content-1', thumbnail: '/contents/aa/aa/aa/aa/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', position: 1 }],
      },
      currentPath: '/screen/detail',
      currentUserId: 'admin',
    });
  });

  test('service 取得に失敗した場合はエラー画面へ 301 リダイレクトする', async () => {
    const getMediaDetailService = {
      execute: jest.fn().mockRejectedValue(new Error('not found')),
    };
    const controller = new ScreenDetailGetController({ getMediaDetailService });
    const res = createRes();

    await controller.execute({ params: { mediaId: 'missing' } }, res);

    expect(res.redirect).toHaveBeenCalledWith(301, '/screen/error');
  });
});
