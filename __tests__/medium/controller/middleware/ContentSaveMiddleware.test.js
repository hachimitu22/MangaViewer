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

  const createApp = ({ adapter, logger = { error: jest.fn() } }) => {
    const app = express();
    app.locals.dependencies = { logger };

    const middleware = new ContentSaveMiddleware({ contentUploadAdapter: adapter });

    app.post('/api/media', middleware.execute.bind(middleware), (_req, res) => {
      res.status(200).json({ code: 0 });
    });

    return { app, logger };
  };

  test('contents[n].file / position / url の構造で送信し、position順のcontentIdsで後続へ委譲できる', async () => {
    const { app } = createApp({
      adapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory }),
    });

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '2')
      .field('contents[0][id]', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      .field('contents[1][position]', '1')
      .attach('contents[1][file]', Buffer.from([0xff, 0xd8, 0xff]), 'same-name.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0 });
  });

  test('contents が未指定の場合は失敗レスポンスを返す', async () => {
    const { app } = createApp({
      adapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory }),
    });

    const response = await request(app)
      .post('/api/media')
      .field('title', 'sample');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });

  test('contents[n].position が重複する場合は失敗レスポンスを返す', async () => {
    const { app } = createApp({
      adapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory }),
    });

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from([0xff, 0xd8, 0xff]), 'same-name.jpg')
      .field('contents[1][position]', '1')
      .field('contents[1][id]', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });

  test('アップロード制限超過時は4xxとcontent.upload.errorログ(reason=size)を返す', async () => {
    const { app, logger } = createApp({
      adapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory }),
    });

    const oversized = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff]),
      Buffer.alloc(50 * 1024 * 1024, 0x00),
    ]);

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', oversized, {
        filename: 'too-big.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ code: 1 });
    expect(logger.error).toHaveBeenCalledWith('content.upload.error', expect.objectContaining({
      reason: 'size',
    }));
  }, 30_000);

  test('不正MIMEタイプ時は4xxとcontent.upload.errorログ(reason=type)を返す', async () => {
    const { app, logger } = createApp({
      adapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory }),
    });

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('text payload'), {
        filename: 'text.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ code: 1 });
    expect(logger.error).toHaveBeenCalledWith('content.upload.error', expect.objectContaining({
      reason: 'type',
    }));
  });
});
