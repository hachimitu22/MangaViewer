const fs = require('fs');
const os = require('os');
const path = require('path');

const request = require('supertest');

const createApp = require('../../../src/app');
const createLoginEnv = () => ({
  loginPassword: 'test-password',
  loginUserId: 'test-user-id',
});

const extractCsrfToken = cookies => {
  const cookie = (cookies || []).find(entry => entry.startsWith('csrf_token='));
  if (!cookie) {
    return '';
  }
  return cookie.split(';')[0].split('=')[1] || '';
};

const createTempPath = (prefix, leaf) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return {
    root,
    target: path.join(root, leaf),
  };
};

describe('setupRoutes not found handler (middle)', () => {
  let app;
  let databasePath;
  let contentRootDirectory;
  let databaseRoot;
  let contentRoot;

  beforeEach(() => {
    const database = createTempPath('app-not-found-db-', 'data.sqlite');
    const contents = createTempPath('app-not-found-content-', 'contents');

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

  const createReadyApp = async (env = {}) => {
    app = createApp({
      databaseStoragePath: databasePath,
      contentRootDirectory,
      ...createLoginEnv(),
      ...env,
    });

    await app.locals.ready;
  };

  test('既存の screen ルートは個別レスポンスを返し、未定義の screen ルートだけが共通 404 JSON を返す', async () => {
    await createReadyApp();

    const existingResponse = await request(app).get('/screen/error');
    expect(existingResponse.status).toBe(200);
    expect(existingResponse.type).toBe('text/html');
    expect(existingResponse.text).toContain('<title>エラーが発生しました</title>');

    const notFoundResponse = await request(app).get('/screen/not-found-handler-target');
    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.type).toMatch(/json/);
    expect(notFoundResponse.body).toEqual({
      message: 'Not Found',
    });
  });

  test('既存の api ルートは個別レスポンスを返し、未定義の api ルートだけが共通 404 JSON を返す', async () => {
    await createReadyApp();
    const bootstrapResponse = await request(app)
      .get('/screen/login')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1');
    const csrfToken = extractCsrfToken(bootstrapResponse.headers['set-cookie']);

    const existingResponse = await request(app)
      .post('/api/login')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', bootstrapResponse.headers['set-cookie'])
      .type('form')
      .send({ username: 'invalid', password: 'invalid' });
    expect(existingResponse.status).toBe(200);
    expect(existingResponse.body).toEqual({ code: 1 });

    const notFoundResponse = await request(app).get('/api/not-found-handler-target');
    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.type).toMatch(/json/);
    expect(notFoundResponse.body).toEqual({
      message: 'Not Found',
    });
  });

  test('認証要否にかかわらず未定義パスは共通 404 JSON を返す', async () => {
    await createReadyApp();

    const unauthenticatedScreenRoute = await request(app).get('/screen/login/not-found');
    expect(unauthenticatedScreenRoute.status).toBe(404);
    expect(unauthenticatedScreenRoute.body).toEqual({
      message: 'Not Found',
    });

    const authenticatedScreenRoute = await request(app).get('/screen/entry/not-found');
    expect(authenticatedScreenRoute.status).toBe(404);
    expect(authenticatedScreenRoute.body).toEqual({
      message: 'Not Found',
    });

    const unauthenticatedApiRoute = await request(app).get('/api/login/not-found');
    expect(unauthenticatedApiRoute.status).toBe(404);
    expect(unauthenticatedApiRoute.body).toEqual({
      message: 'Not Found',
    });

    const authenticatedApiRoute = await request(app).get('/api/media/not-found');
    expect(authenticatedApiRoute.status).toBe(404);
    expect(authenticatedApiRoute.body).toEqual({
      message: 'Not Found',
    });
  });
});
