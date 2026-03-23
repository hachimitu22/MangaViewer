const fs = require('fs');
const os = require('os');
const path = require('path');

const express = require('express');
const request = require('supertest');

const createDependencies = require('../../../src/app/createDependencies');
const setupMiddleware = require('../../../src/app/setupMiddleware');

describe('developmentSession wiring', () => {
  let dependencies;
  let databaseRoot;
  let contentRoot;
  let originalEnv;

  beforeEach(() => {
    jest.resetModules();
    originalEnv = { ...process.env };
    databaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-deps-devsession-db-'));
    contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-deps-devsession-content-'));
  });

  afterEach(async () => {
    if (dependencies) {
      await dependencies.close();
      dependencies = undefined;
    }

    fs.rmSync(databaseRoot, { recursive: true, force: true });
    fs.rmSync(contentRoot, { recursive: true, force: true });
    process.env = originalEnv;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('createDependencies は固定セッション設定が無効な場合はセッションを事前登録しない', async () => {
    dependencies = createDependencies({
      databaseStoragePath: path.join(databaseRoot, 'data.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'contents'),
      devSessionToken: '',
      devSessionUserId: 'admin-dev',
      devSessionTtlMs: 60_000,
    });

    await dependencies.ready;

    await expect(dependencies.authResolver.execute('dev-token')).resolves.toBeUndefined();
  });

  test('setupMiddleware は固定セッション設定が無効な場合は req.session.session_token を補完しない', async () => {
    const app = express();
    setupMiddleware(app, {
      env: {
        devSessionToken: '',
        devSessionUserId: 'admin-dev',
        devSessionTtlMs: 60_000,
        devSessionPaths: ['/screen/entry'],
      },
      dependencies: {},
    });

    app.get('/screen/entry', (req, res) => {
      res.status(200).json({
        sessionToken: req.session.session_token ?? null,
      });
    });

    const response = await request(app).get('/screen/entry');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sessionToken: null,
    });
  });

  test('server.js 相当の初期化では固定セッション設定が無効な場合に有効化ログを出力しない', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit should not be called');
    });
    const listenMock = jest.fn((port, callback) => {
      callback();
      return { on: jest.fn() };
    });

    process.env.PORT = '3456';
    process.env.DEV_SESSION_TOKEN = '';
    process.env.DEV_SESSION_USER_ID = 'admin-dev';
    process.env.DEV_SESSION_TTL_MS = '60000';
    process.env.DEV_SESSION_PATHS = '/screen/entry,/api/media';

    jest.doMock('../../../src/app', () => jest.fn(() => ({
      locals: {
        ready: Promise.resolve(),
      },
      listen: listenMock,
    })));

    require('../../../src/server');
    await Promise.resolve();

    expect(listenMock).toHaveBeenCalledWith(3456, expect.any(Function));
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('開発用固定セッションを有効化しました'));
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
