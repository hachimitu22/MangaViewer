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
          res.status(error.status ?? 200).json({
            code: 1,
            message: error.message,
            reason: error.uploadReason ?? null,
          });
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
      .attach('contents[1][file]', Buffer.from([0xff, 0xd8, 0xff, 0xdb]), 'page1.jpg');

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
  });

  test('既存コンテンツに public パスが指定されても contentId として扱える', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .field('contents[0][url]', '/contents/bb/bb/bb/bb/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      code: 0,
      contentIds: ['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'],
    });
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
      .attach('contents[0][file]', Buffer.from([0xff, 0xd8, 0xff, 0xdb]), 'page1.jpg');

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
    expect(fs.existsSync(generatedPath)).toBe(true);

    randomUUIDSpy.mockRestore();
    expect(crypto.randomUUID).toBe(originalRandomUUID);
  });

  test.each([
    ['position欠落', req => req.attach('contents[0][file]', Buffer.from([0xff, 0xd8, 0xff]), 'page1.jpg'), 200],
    ['fileとurlの両方指定', req => req
      .field('contents[0][position]', '1')
      .field('contents[0][url]', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      .attach('contents[0][file]', Buffer.from([0xff, 0xd8, 0xff]), 'page1.jpg'), 200],
    ['fileとurlの両方欠落', req => req.field('contents[0][position]', '1'), 200],
    ['urlが32文字小文字16進数ではない', req => req
      .field('contents[0][position]', '1')
      .field('contents[0][url]', 'INVALID_CONTENT_ID'), 200],
    ['position重複', req => req
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from([0xff, 0xd8, 0xff]), 'page1.jpg')
      .field('contents[1][position]', '1')
      .field('contents[1][url]', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'), 200],
    ['file fieldnameが不正', req => req
      .field('contents[0][position]', '1')
      .attach('contents[0][image]', Buffer.from([0xff, 0xd8, 0xff]), 'page1.jpg'), 400],
  ])('%s場合は失敗レスポンスを返す', async (_name, buildRequest, expectedStatus) => {
    const app = createApp();

    const response = await buildRequest(request(app).post('/api/media'));

    expect(response.status).toBe(expectedStatus);
    expect(response.body.code).toBe(1);
  });

  test('MIMEタイプ不正なファイルは type 理由で 400 を返す', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('not-image'), {
        filename: 'malicious.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 1,
      reason: 'type',
    });
  });

  test('MIMEタイプとシグネチャが不一致なファイルは type 理由で 400 を返す', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('not-jpeg-signature'), {
        filename: 'fake.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 1,
      reason: 'type',
    });
  });

  test('重複フィールドは count 理由で 400 を返す', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from([0xff, 0xd8, 0xff]), 'first.jpg')
      .attach('contents[0][file]', Buffer.from([0xff, 0xd8, 0xff]), 'second.jpg');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 1,
      reason: 'count',
    });
  });

  test('ファイルサイズ超過は size 理由で 400 を返す', async () => {
    const app = createApp();
    const oversized = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff]),
      Buffer.alloc(50 * 1024 * 1024, 0x00),
    ]);

    const response = await request(app)
      .post('/api/media')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', oversized, {
        filename: 'big.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 1,
      reason: 'size',
    });
  }, 30_000);
});
