const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

const setRouterContentGet = require('../../../../../src/controller/router/content/setRouterContentGet');
const { createContentStoragePath } = require('../../../../../src/presentation/content/contentAssetPaths');

describe('setRouterContentGet', () => {
  let rootDirectory;

  beforeEach(() => {
    rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'content-route-'));
  });

  afterEach(() => {
    fs.rmSync(rootDirectory, { recursive: true, force: true });
  });

  test('保存形式に従って contentId からコンテンツを配信できる', async () => {
    const contentId = '0123456789abcdef0123456789abcdef';
    const contentPath = createContentStoragePath({ rootDirectory, contentId });
    fs.mkdirSync(path.dirname(contentPath), { recursive: true });
    fs.writeFileSync(contentPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    const app = express();
    const router = express.Router();
    setRouterContentGet({ router, contentRootDirectory: rootDirectory });
    app.use(router);

    const response = await request(app).get('/content/01/23/45/67/0123456789abcdef0123456789abcdef');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/png');
    expect(response.body).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  });
});
