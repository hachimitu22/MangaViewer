const fs = require('fs');
const os = require('os');
const path = require('path');

const request = require('supertest');

const createApp = require('../../../src/app');
const createLoginEnv = () => ({
  loginPassword: 'test-password',
  loginUserId: 'test-user-id',
});

const createTempPath = (prefix, leaf) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return {
    root,
    target: path.join(root, leaf),
  };
};

describe('setupRoutes not found handler (small)', () => {
  let app;
  let databasePath;
  let contentRootDirectory;
  let databaseRoot;
  let contentRoot;

  beforeEach(() => {
    const database = createTempPath('app-small-not-found-db-', 'data.sqlite');
    const contents = createTempPath('app-small-not-found-content-', 'contents');

    databaseRoot = database.root;
    contentRoot = contents.root;
    databasePath = database.target;
    contentRootDirectory = contents.target;

    app = createApp({
      databaseStoragePath: databasePath,
      contentRootDirectory,
      ...createLoginEnv(),
    });
  });

  afterEach(async () => {
    if (app?.locals?.close) await app.locals.close();

    fs.rmSync(databaseRoot, { recursive: true, force: true });
    fs.rmSync(contentRoot, { recursive: true, force: true });
    app = undefined;
  });

  test('GET /screen/* の未定義パスは 404 JSON を返す', async () => {
    await app.locals.ready;

    const response = await request(app).get('/screen/not-found-handler-target');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Not Found' });
  });

  test('GET /api/* の未定義パスは 404 JSON を返す', async () => {
    await app.locals.ready;

    const response = await request(app).get('/api/not-found-handler-target');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Not Found' });
  });
});
