const fs = require('fs');
const os = require('os');
const path = require('path');

const express = require('express');
const request = require('supertest');

const MulterDiskStorageContentUploadAdapter = require('../../../src/infrastructure/MulterDiskStorageContentUploadAdapter');

describe('MulterDiskStorageContentUploadAdapter', () => {
  test.each([
    undefined,
    null,
    '',
  ])('rootDirectory が %p の場合は初期化時に例外となる', rootDirectory => {
    expect(() => new MulterDiskStorageContentUploadAdapter({ rootDirectory })).toThrow(Error);
  });

  test('署名不正時に保存済みファイルと空ディレクトリが残らない', async () => {
    const rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'content-upload-adapter-small-'));
    const app = express();
    const adapter = new MulterDiskStorageContentUploadAdapter({ rootDirectory });

    app.post('/api/media', (req, res) => {
      req.context = {};
      adapter.execute(req, res, error => {
        if (error) {
          res.status(error.status ?? 200).json({ code: 1 });
          return;
        }

        res.status(200).json({ code: 0 });
      });
    });

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('invalid-jpeg-signature'), {
        filename: 'fake.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe(1);
    expect(fs.readdirSync(rootDirectory)).toEqual([]);

    fs.rmSync(rootDirectory, { recursive: true, force: true });
  });

  test('大文字を含む contentId でも成功し、小文字に正規化される', async () => {
    const rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'content-upload-adapter-small-'));
    const app = express();
    const adapter = new MulterDiskStorageContentUploadAdapter({ rootDirectory });

    app.post('/api/media', (req, res) => {
      req.context = {};
      adapter.execute(req, res, error => {
        if (error) {
          res.status(error.status ?? 200).json({ code: 1 });
          return;
        }

        res.status(200).json({
          code: 0,
          contentIds: req.context.contentIds,
        });
      });
    });

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .field('contents[0][url]', '/contents/AA/BB/CC/DD/AABBCCDDEEFF00112233445566778899');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      code: 0,
      contentIds: ['aabbccddeeff00112233445566778899'],
    });

    fs.rmSync(rootDirectory, { recursive: true, force: true });
  });
});
