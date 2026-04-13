const setRouterScreenViewerGet = require('../../../../../src/controller/router/screen/setRouterScreenViewerGet');
const {
  FoundResult,
  MediaNotFoundResult,
  ContentNotFoundResult,
} = require('../../../../../src/application/media/query/GetMediaContentWithNavigationService');

describe('setRouterScreenViewerGet', () => {
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

  it('GET /screen/viewer/:mediaId/:mediaPage に認証・描画ハンドラーを登録できる', async () => {
    const router = { get: jest.fn() };
    const authResolver = { execute: jest.fn().mockResolvedValue('u1') };
    const getMediaContentWithNavigationService = {
      execute: jest.fn().mockResolvedValue(new FoundResult({
        contentId: '/contents/page-2.jpg',
        previousContentId: '/contents/page-1.jpg',
        nextContentId: '/contents/page-3.jpg',
      })),
    };

    setRouterScreenViewerGet({ router, authResolver, getMediaContentWithNavigationService });

    expect(router.get).toHaveBeenCalledTimes(1);
    const [path, ...handlers] = router.get.mock.calls[0];
    expect(path).toBe('/screen/viewer/:mediaId/:mediaPage');
    expect(handlers).toHaveLength(2);

    const req = {
      params: { mediaId: 'media-1', mediaPage: '2' },
      session: { session_token: 'token-1' },
      context: {},
    };
    const res = createRes();

    await handlers[0](req, res, async () => {
      await handlers[1](req, res, jest.fn());
    });

    expect(authResolver.execute).toHaveBeenCalledWith('token-1');
    expect(getMediaContentWithNavigationService.execute).toHaveBeenCalledWith(expect.objectContaining({
      mediaId: 'media-1',
      contentPosition: 2,
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('screen/viewer', expect.objectContaining({
      mediaId: 'media-1',
      mediaPage: 2,
      content: expect.objectContaining({ id: '/contents/page-2.jpg', type: 'image' }),
      previousPage: expect.objectContaining({ href: '/screen/viewer/media-1/1' }),
      nextPage: expect.objectContaining({ href: '/screen/viewer/media-1/3' }),
    }));
  });

  test.each([
    ['未存在メディア', new MediaNotFoundResult()],
    ['未存在ページ', new ContentNotFoundResult()],
  ])('%s の場合はエラー画面へリダイレクトする', async (_name, serviceResult) => {
    const router = { get: jest.fn() };
    const authResolver = { execute: jest.fn().mockResolvedValue('u1') };
    const getMediaContentWithNavigationService = {
      execute: jest.fn().mockResolvedValue(serviceResult),
    };

    setRouterScreenViewerGet({ router, authResolver, getMediaContentWithNavigationService });

    const [, , handler] = router.get.mock.calls[0];
    const req = {
      params: { mediaId: 'media-404', mediaPage: '9' },
      session: { session_token: 'token-1' },
      context: {},
    };
    const res = createRes();

    await handler(req, res);

    expect(res.redirect).toHaveBeenCalledWith(301, '/screen/error');
  });
});
