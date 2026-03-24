const express = require('express');
const request = require('supertest');

const ScreenDetailGetController = require('../../../../src/controller/screen/ScreenDetailGetController');
const ScreenViewerGetController = require('../../../../src/controller/screen/ScreenViewerGetController');
const {
  FoundResult,
  MediaNotFoundResult,
  ContentNotFoundResult,
} = require('../../../../src/application/media/query/GetMediaContentWithNavigationService');

const createAppWithRenderCapture = (mountRoute) => {
  const app = express();

  app.use((req, res, next) => {
    res.render = (view, locals) => res.json({ view, locals });
    next();
  });

  mountRoute(app);

  return app;
};

describe('medium: ScreenDetailGetController', () => {
  test('medium: 正常系 - ルーティング由来の req.params.mediaId を使って詳細画面を描画する', async () => {
    const mediaDetail = {
      id: 'media-001',
      title: '作品タイトル',
      registeredAt: '2026-03-20 12:34 UTC',
      contents: [{ id: 'content-001', thumbnail: 'content-001', position: 1 }],
      tags: [{ category: '作者', label: '山田' }],
      categories: ['作者'],
      priorityCategories: ['作者'],
    };
    const getMediaDetailService = {
      execute: jest.fn().mockResolvedValue({ mediaDetail }),
    };
    const app = createAppWithRenderCapture((instance) => {
      const controller = new ScreenDetailGetController({ getMediaDetailService });
      instance.get('/screen/detail/:mediaId', (req, res) => controller.execute(req, res));
    });

    const response = await request(app).get('/screen/detail/media-001');

    expect(response.status).toBe(200);
    expect(getMediaDetailService.execute).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'media-001' }));
    expect(response.body).toEqual({
      view: 'screen/detail',
      locals: {
        pageTitle: '作品タイトル の詳細',
        mediaDetail,
      },
    });
  });

  test('medium: サービス例外時は /screen/error へ 301 リダイレクトする', async () => {
    const getMediaDetailService = {
      execute: jest.fn().mockRejectedValue(new Error('unexpected')),
    };
    const app = createAppWithRenderCapture((instance) => {
      const controller = new ScreenDetailGetController({ getMediaDetailService });
      instance.get('/screen/detail/:mediaId', (req, res) => controller.execute(req, res));
    });

    const response = await request(app).get('/screen/detail/missing');

    expect(response.status).toBe(301);
    expect(response.headers.location).toBe('/screen/error');
  });
});

describe('medium: ScreenViewerGetController', () => {
  test('medium: 画像コンテンツ時は image 判定と前後ページリンクを描画モデルに含める', async () => {
    const getMediaContentWithNavigationService = {
      execute: jest.fn().mockResolvedValue(new FoundResult({
        contentId: '/contents/page-2.jpg',
        previousContentId: '/contents/page-1.jpg',
        nextContentId: '/contents/page-3.jpg',
      })),
    };
    const app = createAppWithRenderCapture((instance) => {
      const controller = new ScreenViewerGetController({ getMediaContentWithNavigationService });
      instance.get('/screen/viewer/:mediaId/:mediaPage', (req, res) => controller.execute(req, res));
    });

    const response = await request(app).get('/screen/viewer/media-001/2');

    expect(response.status).toBe(200);
    expect(getMediaContentWithNavigationService.execute).toHaveBeenCalledWith(expect.objectContaining({
      mediaId: 'media-001',
      contentPosition: 2,
    }));
    expect(response.body).toEqual({
      view: 'screen/viewer',
      locals: {
        pageTitle: 'ビューアー media-001 - 2ページ',
        mediaId: 'media-001',
        mediaPage: 2,
        content: {
          id: '/contents/page-2.jpg',
          type: 'image',
        },
        previousPage: {
          mediaId: 'media-001',
          mediaPage: 1,
          contentId: '/contents/page-1.jpg',
          href: '/screen/viewer/media-001/1',
        },
        nextPage: {
          mediaId: 'media-001',
          mediaPage: 3,
          contentId: '/contents/page-3.jpg',
          href: '/screen/viewer/media-001/3',
        },
      },
    });
  });

  test('medium: 動画コンテンツ時は video 判定となり前後ページ導線なしで描画する', async () => {
    const getMediaContentWithNavigationService = {
      execute: jest.fn().mockResolvedValue(new FoundResult({
        contentId: '/contents/page-10.mp4',
        previousContentId: null,
        nextContentId: null,
      })),
    };
    const app = createAppWithRenderCapture((instance) => {
      const controller = new ScreenViewerGetController({ getMediaContentWithNavigationService });
      instance.get('/screen/viewer/:mediaId/:mediaPage', (req, res) => controller.execute(req, res));
    });

    const response = await request(app).get('/screen/viewer/media-video/10');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      view: 'screen/viewer',
      locals: expect.objectContaining({
        mediaId: 'media-video',
        mediaPage: 10,
        content: {
          id: '/contents/page-10.mp4',
          type: 'video',
        },
        previousPage: null,
        nextPage: null,
      }),
    });
  });

  test.each([
    ['MediaNotFoundResult', new MediaNotFoundResult()],
    ['ContentNotFoundResult', new ContentNotFoundResult()],
  ])('medium: %s の場合は /screen/error へ 301 リダイレクトする', async (_name, serviceResult) => {
    const getMediaContentWithNavigationService = {
      execute: jest.fn().mockResolvedValue(serviceResult),
    };
    const app = createAppWithRenderCapture((instance) => {
      const controller = new ScreenViewerGetController({ getMediaContentWithNavigationService });
      instance.get('/screen/viewer/:mediaId/:mediaPage', (req, res) => controller.execute(req, res));
    });

    const response = await request(app).get('/screen/viewer/media-404/99');

    expect(response.status).toBe(301);
    expect(response.headers.location).toBe('/screen/error');
  });
});
