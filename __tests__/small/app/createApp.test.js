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
  let app;
  let databasePath;
  let contentRootDirectory;
  let databaseRoot;
  let contentRoot;

  beforeEach(() => {
    const database = createTempPath('app-db-', 'data.sqlite');
    const contents = createTempPath('app-content-', 'contents');

    databaseRoot = database.root;
    contentRoot = contents.root;
    databasePath = database.target;
    contentRootDirectory = contents.target;
  });

  afterEach(async () => {
    if (app?.locals?.close) await app.locals.close();

    fs.rmSync(databaseRoot, { recursive: true, force: true });
    fs.rmSync(contentRoot, { recursive: true, force: true });
    app = undefined;
  });

  test('構築した app は /screen/error と /api/media を提供し、未知のルートでは404を返す', async () => {
    app = createApp({
      databaseStoragePath: databasePath,
      contentRootDirectory,
    });

    await app.locals.ready;

    const errorScreenResponse = await request(app).get('/screen/error');
    expect(errorScreenResponse.status).toBe(200);
    expect(errorScreenResponse.type).toBe('text/html');
    expect(errorScreenResponse.text).toContain('<title>エラーが発生しました</title>');

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


  test('固定セッション設定が無効な場合は対象パスでも自動補完されず認証エラーになる', async () => {
    app = createApp({
      databaseStoragePath: databasePath,
      contentRootDirectory,
      devSessionToken: '',
      devSessionUserId: 'admin-dev',
      devSessionTtlMs: 60_000,
      devSessionPaths: ['/screen/entry', '/api/media'],
    });

    await app.locals.ready;

    const screenResponse = await request(app).get('/screen/entry');
    expect(screenResponse.status).toBe(401);
    expect(screenResponse.body).toEqual({
      message: '認証に失敗しました',
    });

    const mediaResponse = await request(app)
      .post('/api/media')
      .field('title', 'sample title')
      .field('tags[0][category]', '作者')
      .field('tags[0][label]', '山田')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('a'), 'first.jpg');

    expect(mediaResponse.status).toBe(401);
    expect(mediaResponse.body).toEqual({
      message: '認証に失敗しました',
    });
  });

  test('固定セッション設定がある場合は /screen/entry と /screen/search と /screen/summary と /api/media で認証を補完し、/screen/login を表示できる', async () => {
    app = createApp({
      databaseStoragePath: databasePath,
      contentRootDirectory,
      devSessionToken: 'dev-token',
      devSessionUserId: 'admin-dev',
      devSessionTtlMs: 60_000,
      devSessionPaths: ['/screen/entry', '/screen/search', '/screen/summary', '/api/media'],
    });

    await app.locals.ready;

    const screenResponse = await request(app).get('/screen/entry');
    expect(screenResponse.status).toBe(200);
    expect(screenResponse.type).toBe('text/html');
    expect(screenResponse.text).toContain('<title>メディア登録</title>');

    const searchResponse = await request(app).get('/screen/search');
    expect(searchResponse.status).toBe(200);
    expect(searchResponse.type).toBe('text/html');
    expect(searchResponse.text).toContain('<title>メディア検索</title>');


    const summaryResponse = await request(app).get('/screen/summary');
    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.type).toBe('text/html');
    expect(summaryResponse.text).toContain('<title>メディア一覧</title>');

    const loginResponse = await request(app).get('/screen/login');
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.type).toBe('text/html');
    expect(loginResponse.text).toContain('<title>ログイン</title>');
    expect(loginResponse.text).toContain('action="/api/login"');

    const mediaResponse = await request(app)
      .post('/api/media')
      .field('title', 'sample title')
      .field('tags[0][category]', '作者')
      .field('tags[0][label]', '山田')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('a'), 'first.jpg');

    expect(mediaResponse.status).toBe(200);
    expect(mediaResponse.body).toEqual({
      code: 0,
      mediaId: expect.stringMatching(/^[0-9a-f]{32}$/),
    });
  });
});
