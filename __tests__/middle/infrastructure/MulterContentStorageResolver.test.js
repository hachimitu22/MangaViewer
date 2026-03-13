const express = require('express');
const multer = require('multer');
const request = require('supertest');
const MulterContentStorageResolver = require('../../../src/infrastructure/MulterContentStorageResolver');

describe('MulterContentStorageResolver', () => {
  test('constructor: multer() の戻り値以外はエラーになる', () => {
    expect(() => new MulterContentStorageResolver()).toThrow('multer() の戻り値を指定してください。');
    expect(() => new MulterContentStorageResolver({})).toThrow('multer() の戻り値を指定してください。');
  });

  test('resolveSingle: contents のアップロード時に filename/contentId を UUID(ハイフン無し)で設定する', async () => {
    const app = express();
    const uploader = multer({ storage: multer.memoryStorage() });
    const resolver = new MulterContentStorageResolver(uploader);

    app.post('/upload', resolver.resolveSingle('contents'), (req, res) => {
      res.status(200).json({
        contentId: req.contentId,
        filename: req.file && req.file.filename,
        fileContentId: req.file && req.file.contentId,
      });
    });

    const response = await request(app)
      .post('/upload')
      .attach('contents', Buffer.from('dummy data'), 'sample.txt');

    expect(response.status).toBe(200);
    expect(response.body.contentId).toMatch(/^[0-9a-f]{32}$/);
    expect(response.body.filename).toBe(response.body.contentId);
    expect(response.body.fileContentId).toBe(response.body.contentId);
  });

  test('resolveSingle: 対象フィールドにファイルが無い場合は contentId を設定しない', async () => {
    const app = express();
    const uploader = multer({ storage: multer.memoryStorage() });
    const resolver = new MulterContentStorageResolver(uploader);

    app.post('/upload', resolver.resolveSingle('contents'), (req, res) => {
      res.status(200).json({
        contentId: req.contentId || null,
        hasFile: Boolean(req.file),
      });
    });

    const response = await request(app)
      .post('/upload')
      .field('title', 'no-file');

    expect(response.status).toBe(200);
    expect(response.body.hasFile).toBe(false);
    expect(response.body.contentId).toBeNull();
  });
});
