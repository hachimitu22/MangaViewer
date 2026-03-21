const fs = require('fs');
const os = require('os');
const path = require('path');

const request = require('supertest');

const createApp = require('../../../src/app');

const createTempPath = (prefix, leaf) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return {
    root,
    target: path.join(root, leaf),
  };
};

describe('createApp', () => {
  let databasePath;
  let contentRootDirectory;
  let cleanupRoots;

  beforeEach(() => {
    cleanupRoots = [];

    const database = createTempPath('app-db-', 'data.sqlite');
    const contents = createTempPath('app-content-', 'contents');

    cleanupRoots.push(database.root, contents.root);
    databasePath = database.target;
    contentRootDirectory = contents.target;
  });

  afterEach(() => {
    for (const root of cleanupRoots) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('構築した app は /api/media を提供し、未知のルートでは404を返す', async () => {
    const app = createApp({
      databaseStoragePath: databasePath,
      contentRootDirectory,
    });

    await app.locals.ready;

    const notFoundResponse = await request(app).get('/unknown');
    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.body).toEqual({
      message: 'Not Found',
    });

    const unauthorizedResponse = await request(app)
      .post('/api/media')
      .field('title', 'sample title')
      .field('tags[0][category]', '作者')
      .field('tags[0][label]', '山田')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('a'), 'first.jpg');

    expect(unauthorizedResponse.status).toBe(401);
    expect(unauthorizedResponse.body).toEqual({
      message: '認証に失敗しました',
    });
  });
});
