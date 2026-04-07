const ScreenViewerGetController = require('../../../../src/controller/screen/ScreenViewerGetController');
const {
  FoundResult,
  MediaNotFoundResult,
  ContentNotFoundResult,
} = require('../../../../src/application/media/query/GetMediaContentWithNavigationService');

describe('ScreenViewerGetController', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      render: jest.fn(),
      redirect: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  test('FoundResult の場合は viewer 描画モデルを生成して描画する', async () => {
    const getMediaContentWithNavigationService = {
      execute: jest.fn().mockResolvedValue(new FoundResult({
        contentId: '/contents/page-2.jpg',
        previousContentId: '/contents/page-1.jpg',
        nextContentId: '/contents/page-3.jpg',
      })),
    };
    const controller = new ScreenViewerGetController({ getMediaContentWithNavigationService });
    const req = { params: { mediaId: 'media-1', mediaPage: '2' }, context: { userId: 'admin' } };
    const res = createRes();

    await controller.execute(req, res);

    expect(getMediaContentWithNavigationService.execute).toHaveBeenCalledWith(expect.objectContaining({
      mediaId: 'media-1',
      contentPosition: 2,
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.render).toHaveBeenCalledWith('screen/viewer', {
      pageTitle: 'ビューアー media-1 - 2ページ',
      mediaId: 'media-1',
      mediaPage: 2,
      currentPath: '/screen/viewer',
      currentUserId: 'admin',
      content: {
        id: '/contents/page-2.jpg',
        type: 'image',
      },
      previousPage: {
        mediaId: 'media-1',
        mediaPage: 1,
        contentId: '/contents/page-1.jpg',
        href: '/screen/viewer/media-1/1',
      },
      nextPage: {
        mediaId: 'media-1',
        mediaPage: 3,
        contentId: '/contents/page-3.jpg',
        href: '/screen/viewer/media-1/3',
      },
    });
  });

  test('動画 contentId は type=video として先頭/末尾導線なしを描画する', async () => {
    const getMediaContentWithNavigationService = {
      execute: jest.fn().mockResolvedValue(new FoundResult({
        contentId: '/contents/page-10.mp4',
        previousContentId: null,
        nextContentId: null,
      })),
    };
    const controller = new ScreenViewerGetController({ getMediaContentWithNavigationService });
    const res = createRes();

    await controller.execute({ params: { mediaId: 'media-video', mediaPage: '10' } }, res);

    expect(res.render).toHaveBeenCalledWith('screen/viewer', expect.objectContaining({
      content: {
        id: '/contents/page-10.mp4',
        type: 'video',
      },
      previousPage: null,
      nextPage: null,
    }));
  });

  test('拡張子なしの32桁 contentId でも contentType が video なら type=video として描画する', async () => {
    const getMediaContentWithNavigationService = {
      execute: jest.fn().mockResolvedValue(new FoundResult({
        contentId: '0123456789abcdef0123456789abcdef',
        previousContentId: null,
        nextContentId: null,
        contentType: 'video',
      })),
    };
    const controller = new ScreenViewerGetController({ getMediaContentWithNavigationService });
    const res = createRes();

    await controller.execute({ params: { mediaId: 'media-video', mediaPage: '1' } }, res);

    expect(res.render).toHaveBeenCalledWith('screen/viewer', expect.objectContaining({
      content: {
        id: '/contents/0123456789abcdef0123456789abcdef',
        type: 'video',
      },
    }));
  });

  test.each([
    ['MediaNotFoundResult', new MediaNotFoundResult()],
    ['ContentNotFoundResult', new ContentNotFoundResult()],
  ])('%s の場合はエラー画面へ 301 リダイレクトする', async (_name, serviceResult) => {
    const getMediaContentWithNavigationService = {
      execute: jest.fn().mockResolvedValue(serviceResult),
    };
    const controller = new ScreenViewerGetController({ getMediaContentWithNavigationService });
    const res = createRes();

    await controller.execute({ params: { mediaId: 'media-404', mediaPage: '99' } }, res);

    expect(res.redirect).toHaveBeenCalledWith(301, '/screen/error');
  });

  test.each(['1abc', '01'])('mediaPage が不正値(%s)なら service 呼び出し前にエラー画面へ 301 リダイレクトする', async (invalidMediaPage) => {
    const getMediaContentWithNavigationService = {
      execute: jest.fn(),
    };
    const controller = new ScreenViewerGetController({ getMediaContentWithNavigationService });
    const res = createRes();

    await controller.execute({ params: { mediaId: 'media-1', mediaPage: invalidMediaPage } }, res);

    expect(getMediaContentWithNavigationService.execute).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(301, '/screen/error');
  });

  test('想定外の戻り値や service 例外時はエラー画面へ 301 リダイレクトする', async () => {
    const unexpectedService = {
      execute: jest.fn().mockResolvedValue({ kind: 'unexpected' }),
    };
    const rejectedService = {
      execute: jest.fn().mockRejectedValue(new Error('failed')),
    };
    const unexpectedController = new ScreenViewerGetController({
      getMediaContentWithNavigationService: unexpectedService,
    });
    const rejectedController = new ScreenViewerGetController({
      getMediaContentWithNavigationService: rejectedService,
    });
    const unexpectedRes = createRes();
    const rejectedRes = createRes();

    await unexpectedController.execute({ params: { mediaId: 'media-1', mediaPage: '1' } }, unexpectedRes);
    await rejectedController.execute({ params: { mediaId: 'media-1', mediaPage: '1' } }, rejectedRes);

    expect(unexpectedRes.redirect).toHaveBeenCalledWith(301, '/screen/error');
    expect(rejectedRes.redirect).toHaveBeenCalledWith(301, '/screen/error');
  });
});
