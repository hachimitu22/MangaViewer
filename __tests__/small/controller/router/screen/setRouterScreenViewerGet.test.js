const setRouterScreenViewerGet = require('../../../../../src/controller/router/screen/setRouterScreenViewerGet');
const { FoundResult, MediaNotFoundResult, ContentNotFoundResult } = require('../../../../../src/application/media/query/GetMediaContentWithNavigationService');

describe('setRouterScreenViewerGet', () => {
  const createRes = () => {
    const res = { status: jest.fn(), render: jest.fn(), redirect: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
  };

  it('GET /screen/viewer/:mediaId/:mediaPage に描画ハンドラーを登録できる', async () => {
    const router = { get: jest.fn() };
    const getMediaContentWithNavigationService = { execute: jest.fn().mockResolvedValue(new FoundResult({ contentId: '/contents/page-2.jpg', previousContentId: '/contents/page-1.jpg', nextContentId: '/contents/page-3.jpg' })) };

    setRouterScreenViewerGet({ router, getMediaContentWithNavigationService });

    const [path, handler] = router.get.mock.calls[0];
    expect(path).toBe('/screen/viewer/:mediaId/:mediaPage');
    const req = { params: { mediaId: 'media-1', mediaPage: '2' }, context: {} };
    const res = createRes();
    await handler(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test.each([['未存在メディア', new MediaNotFoundResult()], ['未存在ページ', new ContentNotFoundResult()]])('%s の場合はエラー画面へリダイレクトする', async (_name, serviceResult) => {
    const router = { get: jest.fn() };
    const getMediaContentWithNavigationService = { execute: jest.fn().mockResolvedValue(serviceResult) };
    setRouterScreenViewerGet({ router, getMediaContentWithNavigationService });
    const [, handler] = router.get.mock.calls[0];
    const req = { params: { mediaId: 'media-404', mediaPage: '9' }, context: {} };
    const res = createRes();
    await handler(req, res);
    expect(res.redirect).toHaveBeenCalledWith(301, '/screen/error');
  });
});
