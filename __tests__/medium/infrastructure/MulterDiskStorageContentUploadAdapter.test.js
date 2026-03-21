const fs = require('fs');
const os = require('os');
const path = require('path');

const express = require('express');
const request = require('supertest');

const MulterDiskStorageContentUploadAdapter = require('../../../src/infrastructure/MulterDiskStorageContentUploadAdapter');

const createTempDirectory = () => fs.mkdtempSync(path.join(os.tmpdir(), 'content-upload-adapter-'));

const removeDirectory = directory => {
  fs.rmSync(directory, { recursive: true, force: true });
};

describe('MulterDiskStorageContentUploadAdapter', () => {
  let rootDirectory;

  beforeEach(() => {
    rootDirectory = createTempDirectory();
  });

  afterEach(() => {
    removeDirectory(rootDirectory);
  });

  const createApp = ({ rootDir = rootDirectory } = {}) => {
    const app = express();
    const adapter = new MulterDiskStorageContentUploadAdapter({ rootDirectory: rootDir });

    app.post('/api/media', (req, res) => {
      req.context = {};
      adapter.execute(req, res, error => {
        if (error) {
          res.status(200).json({ code: 1, message: error.message });
          return;
        }

        res.status(200).json({
          code: 0,
          contentIds: req.context.contentIds,
        });
      });
    });

    return app;
  };

  test('新規ファイルと既存contentIdをposition順に処理し、新規ファイルを分割パスへ保存できる', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '2')
      .field('contents[0][url]', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      .field('contents[1][position]', '1')
      .attach('contents[1][file]', Buffer.from('new-content'), 'page1.jpg');

    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.contentIds).toHaveLength(2);
    expect(response.body.contentIds[1]).toBe('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(response.body.contentIds[0]).toMatch(/^[0-9a-f]{32}$/);

    const generatedContentId = response.body.contentIds[0];
    const savedPath = path.join(
      rootDirectory,
      generatedContentId.slice(0, 2),
      generatedContentId.slice(2, 4),
      generatedContentId.slice(4, 6),
      generatedContentId.slice(6, 8),
      generatedContentId
    );

    expect(fs.existsSync(savedPath)).toBe(true);
    expect(fs.readFileSync(savedPath, 'utf8')).toBe('new-content');
  });

  test('保存先パスが衝突した場合はcontentIdを再生成して保存する', async () => {
    const app = createApp();
    const existingContentId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const existingPath = path.join(
      rootDirectory,
      existingContentId.slice(0, 2),
      existingContentId.slice(2, 4),
      existingContentId.slice(4, 6),
      existingContentId.slice(6, 8),
      existingContentId
    );
    fs.mkdirSync(path.dirname(existingPath), { recursive: true });
    fs.writeFileSync(existingPath, 'existing');

    const crypto = require('crypto');
    const originalRandomUUID = crypto.randomUUID;
    const randomUUIDSpy = jest.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .mockReturnValueOnce('cccccccc-cccc-cccc-cccc-cccccccccccc');

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('new'), 'page1.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      code: 0,
      contentIds: ['cccccccccccccccccccccccccccccccc'],
    });
    expect(fs.readFileSync(existingPath, 'utf8')).toBe('existing');

    const generatedPath = path.join(
      rootDirectory,
      'cc',
      'cc',
      'cc',
      'cc',
      'cccccccccccccccccccccccccccccccc'
    );
    expect(fs.readFileSync(generatedPath, 'utf8')).toBe('new');

    randomUUIDSpy.mockRestore();
    expect(crypto.randomUUID).toBe(originalRandomUUID);
  });

  test.each([
    ['position欠落', request => request.attach('contents[0][file]', Buffer.from('a'), 'page1.jpg')],
    ['fileとurlの両方指定', request => request
      .field('contents[0][position]', '1')
      .field('contents[0][url]', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      .attach('contents[0][file]', Buffer.from('a'), 'page1.jpg')],
    ['fileとurlの両方欠落', request => request.field('contents[0][position]', '1')],
    ['urlが32文字小文字16進数ではない', request => request
      .field('contents[0][position]', '1')
      .field('contents[0][url]', 'INVALID_CONTENT_ID')],
    ['position重複', request => request
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('a'), 'page1.jpg')
      .field('contents[1][position]', '1')
      .field('contents[1][url]', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')],
    ['file fieldnameが不正', request => request
      .field('contents[0][position]', '1')
      .attach('contents[0][image]', Buffer.from('a'), 'page1.jpg')],
  ])('%s場合はcb(error)相当の失敗レスポンスを返す', async (_name, buildRequest) => {
    const app = createApp();

    const response = await buildRequest(request(app).post('/api/media'));

    expect(response.status).toBe(200);
    expect(response.body.code).toBe(1);
  });
});
