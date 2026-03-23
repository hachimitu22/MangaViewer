const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ContentSaveMiddleware = require('../../../../src/controller/middleware/ContentSaveMiddleware');
const MulterDiskStorageContentUploadAdapter = require('../../../../src/infrastructure/MulterDiskStorageContentUploadAdapter');

describe('ContentSaveMiddleware (middle)', () => {
  let rootDirectory;

  beforeEach(() => {
    rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'content-save-middleware-'));
  });

  afterEach(() => {
    fs.rmSync(rootDirectory, { recursive: true, force: true });
  });

  const createApp = ({ adapter }) => {
    const app = express();
    const middleware = new ContentSaveMiddleware({ contentUploadAdapter: adapter });

    app.post('/api/media', middleware.execute.bind(middleware), (_req, res) => {
      res.status(200).json({ code: 0 });
    });

    return app;
  };

  test('contents[n].file / position / url の構造で送信し、position順のcontentIdsで後続へ委譲できる', async () => {
    const app = createApp({
      adapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory }),
    });

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '2')
      .field('contents[0][id]', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      .field('contents[1][position]', '1')
      .attach('contents[1][file]', Buffer.from('a'), 'same-name.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0 });
  });

  test('contents が未指定の場合は失敗レスポンスを返す', async () => {
    const app = createApp({
      adapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory }),
    });

    const response = await request(app)
      .post('/api/media')
      .field('title', 'sample');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });

  test('contents[n].position が重複する場合は失敗レスポンスを返す', async () => {
    const app = createApp({
      adapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory }),
    });

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('a'), 'same-name.jpg')
      .field('contents[1][position]', '1')
      .field('contents[1][id]', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });
});
