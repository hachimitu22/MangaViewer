const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

const MulterDiskStorageContentUploadAdapter = require('../../../src/infrastructure/MulterDiskStorageContentUploadAdapter');

describe('MulterDiskStorageContentUploadAdapter', () => {
  let rootDirectory;

  beforeEach(() => {
    rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'multer-disk-storage-content-upload-adapter-small-'));
  });

  afterEach(() => {
    fs.rmSync(rootDirectory, { recursive: true, force: true });
  });

  test.each([
    undefined,
    null,
    '',
  ])('rootDirectory が %p の場合は初期化時に例外となる', rootDirectory => {
    expect(() => new MulterDiskStorageContentUploadAdapter({ rootDirectory })).toThrow(Error);
  });

  test('大文字のcontentIdでも正規化されて成功する', async () => {
    const adapter = new MulterDiskStorageContentUploadAdapter({ rootDirectory });
    const app = express();

    app.post('/upload', (req, res) => {
      adapter.execute(req, res, error => {
        if (error) {
          res.status(error.status ?? 500).json({ message: error.message });
          return;
        }

        res.status(200).json({ contentIds: req.context.contentIds });
      });
    });

    const response = await request(app)
      .post('/upload')
      .field('contents[0][position]', '1')
      .field('contents[0][id]', 'ABCDEF0123456789ABCDEF0123456789');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      contentIds: ['abcdef0123456789abcdef0123456789'],
    });
  });
});
