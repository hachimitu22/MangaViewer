const express = require('express');
const request = require('supertest');
const multer = require('multer');

const ContentSaveMiddleware = require('../../../../src/controller/middleware/ContentSaveMiddleware');

describe('ContentSaveMiddleware (middle)', () => {
  const createMulterAdapter = () => {
    const upload = multer({ storage: multer.memoryStorage() }).any();

    return {
      execute: (req, res, cb) => {
        upload(req, res, error => {
          if (error) {
            cb(error);
            return;
          }

          req.context = req.context ?? {};
          req.context.contentIds = (req.files ?? []).map(file => file.originalname);
          cb();
        });
      },
    };
  };

  const createApp = ({ adapter }) => {
    const app = express();
    const middleware = new ContentSaveMiddleware({ contentUploadAdapter: adapter });

    app.post('/api/media', middleware.execute.bind(middleware), (_req, res) => {
      res.status(200).json({ code: 0 });
    });

    return app;
  };

  test('multer(memoryStorage)でアップロードされた複数ファイルのcontentIdsを検証し後続へ委譲できる', async () => {
    const app = createApp({ adapter: createMulterAdapter() });

    const response = await request(app)
      .post('/api/media')
      .attach('files', Buffer.from('a'), 'c1.jpg')
      .attach('files', Buffer.from('b'), 'c2.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0 });
  });

  test('multer(memoryStorage)でファイル未指定の場合は失敗レスポンスを返す', async () => {
    const app = createApp({ adapter: createMulterAdapter() });

    const response = await request(app)
      .post('/api/media')
      .field('title', 'sample');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });

  test('multer(memoryStorage)で重複ファイル名を受けた場合は失敗レスポンスを返す', async () => {
    const app = createApp({ adapter: createMulterAdapter() });

    const response = await request(app)
      .post('/api/media')
      .attach('files', Buffer.from('a'), 'dup.jpg')
      .attach('files', Buffer.from('b'), 'dup.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });
});
