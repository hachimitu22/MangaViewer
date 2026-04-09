const fs = require('fs');
const os = require('os');
const path = require('path');

const express = require('express');
const request = require('supertest');

const createDependencies = require('../../../src/app/createDependencies');
const setupMiddleware = require('../../../src/app/setupMiddleware');
const createLoginEnv = () => ({
  loginUsername: 'test-user',
  loginPassword: 'test-password',
  loginUserId: 'test-user-id',
});

describe('developmentSession wiring', () => {
  let dependencies;
  let databaseRoot;
  let contentRoot;
  let originalEnv;

  beforeEach(() => {
    jest.resetModules();
    originalEnv = { ...process.env };
    process.env.APP_ORIGIN = 'http://127.0.0.1';
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
      ...createLoginEnv(),
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

  test('setupMiddleware は production 環境では固定セッション設定が揃っていても req.session.session_token を補完しない', async () => {
    const app = express();
    setupMiddleware(app, {
      env: {
        nodeEnv: 'production',
        devSessionToken: 'dev-token',
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
    const listenMock = jest.fn((port, host, callback) => {
      callback();
      return { on: jest.fn() };
    });

    process.env.PORT = '3456';
    process.env.DEV_SESSION_TOKEN = '';
    process.env.DEV_SESSION_USER_ID = 'admin-dev';
    process.env.DEV_SESSION_TTL_MS = '60000';
    process.env.DEV_SESSION_PATHS = '/screen/entry,/api/media';
    process.env.LOGIN_USERNAME = 'admin-user';
    process.env.LOGIN_PASSWORD = 'admin-password';
    process.env.LOGIN_USER_ID = 'admin-user-id';

    jest.doMock('../../../src/app', () => jest.fn(() => ({
      locals: {
        ready: Promise.resolve(),
      },
      listen: listenMock,
    })));

    require('../../../src/server');
    await Promise.resolve();

    expect(listenMock).toHaveBeenCalledWith(3456, '127.0.0.1', expect.any(Function));
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('開発用固定セッションを有効化しました'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('開発用固定セッションは無効です: ENABLE_DEV_SESSION が未指定のため適用しません'));
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('server.js 相当の初期化では認証設定不足時に起動失敗する', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const listenMock = jest.fn((port, host, callback) => {
      callback();
      return { on: jest.fn() };
    });

    process.env.NODE_ENV = 'development';
    process.env.PORT = '3457';
    process.env.FIXED_LOGIN_USERNAME = '';
    process.env.FIXED_LOGIN_PASSWORD = '';
    process.env.FIXED_LOGIN_USER_ID = '';
    process.env.LOGIN_USERNAME = '';
    process.env.LOGIN_PASSWORD = '';
    process.env.LOGIN_USER_ID = '';
    process.env.ALLOW_INSECURE_DEFAULT_LOGIN = '';

    jest.doMock('../../../src/app', () => jest.fn(() => ({
      locals: {
        ready: Promise.resolve(),
      },
      listen: listenMock,
    })));

    require('../../../src/server');
    await Promise.resolve();

    expect(listenMock).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('サーバーを起動しました'));
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('サーバーの起動に失敗しました: ログイン認証設定が不足しています'),
      expect.any(Error),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('server.js 相当の初期化では明示フラグ有効時に insecure デフォルト資格情報で起動できる', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const listenMock = jest.fn((port, host, callback) => {
      callback();
      return { on: jest.fn() };
    });

    process.env.NODE_ENV = 'development';
    process.env.PORT = '3458';
    process.env.FIXED_LOGIN_USERNAME = '';
    process.env.FIXED_LOGIN_PASSWORD = '';
    process.env.FIXED_LOGIN_USER_ID = '';
    process.env.LOGIN_USERNAME = '';
    process.env.LOGIN_PASSWORD = '';
    process.env.LOGIN_USER_ID = '';
    process.env.ALLOW_INSECURE_DEFAULT_LOGIN = 'true';

    jest.doMock('../../../src/app', () => jest.fn(() => ({
      locals: {
        ready: Promise.resolve(),
      },
      listen: listenMock,
    })));

    require('../../../src/server');
    await Promise.resolve();

    expect(listenMock).toHaveBeenCalledWith(3458, '127.0.0.1', expect.any(Function));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('サーバーを起動しました'));
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('server.js 相当の初期化では production かつ insecure login 指定時に起動を中止する', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const listenMock = jest.fn((port, host, callback) => {
      callback();
      return { on: jest.fn() };
    });

    process.env.NODE_ENV = 'production';
    process.env.PORT = '3459';
    process.env.FIXED_LOGIN_USERNAME = '';
    process.env.FIXED_LOGIN_PASSWORD = '';
    process.env.FIXED_LOGIN_USER_ID = '';
    process.env.LOGIN_USERNAME = '';
    process.env.LOGIN_PASSWORD = '';
    process.env.LOGIN_USER_ID = '';
    process.env.ALLOW_INSECURE_DEFAULT_LOGIN = 'true';

    jest.doMock('../../../src/app', () => jest.fn(() => ({
      locals: {
        ready: Promise.resolve(),
      },
      listen: listenMock,
    })));

    require('../../../src/server');
    await Promise.resolve();

    expect(listenMock).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('サーバーを起動しました'));
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('サーバーの起動を中止しました: 本番環境で insecure login(ALLOW_INSECURE_DEFAULT_LOGIN=true) は禁止されています'),
      expect.any(Error),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('server.js 相当の初期化では production かつ DEV_SESSION_* 指定時に起動を中止する', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const listenMock = jest.fn((port, host, callback) => {
      callback();
      return { on: jest.fn() };
    });

    process.env.NODE_ENV = 'production';
    process.env.PORT = '3460';
    process.env.FIXED_LOGIN_USERNAME = 'admin-user';
    process.env.FIXED_LOGIN_PASSWORD = 'admin-password';
    process.env.FIXED_LOGIN_USER_ID = 'admin-user-id';
    process.env.LOGIN_USERNAME = 'admin-user';
    process.env.LOGIN_PASSWORD = 'admin-password';
    process.env.LOGIN_USER_ID = 'admin-user-id';
    process.env.ALLOW_INSECURE_DEFAULT_LOGIN = '';
    process.env.DEV_SESSION_TOKEN = 'dev-token';
    process.env.DEV_SESSION_USER_ID = '';
    process.env.DEV_SESSION_TTL_MS = '';
    process.env.DEV_SESSION_PATHS = '';

    jest.doMock('../../../src/app', () => jest.fn(() => ({
      locals: {
        ready: Promise.resolve(),
      },
      listen: listenMock,
    })));

    require('../../../src/server');
    await Promise.resolve();

    expect(listenMock).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('サーバーを起動しました'));
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('サーバーの起動を中止しました: 本番環境で DEV_SESSION_* の設定は禁止されています'),
      expect.any(Error),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('server.js 相当の初期化では production かつ SERVER_HOST=0.0.0.0 の指定を許可する', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const listenMock = jest.fn((port, host, callback) => {
      callback();
      return { on: jest.fn() };
    });

    process.env.NODE_ENV = 'production';
    process.env.PORT = '3461';
    process.env.SERVER_HOST = '0.0.0.0';
    process.env.FIXED_LOGIN_USERNAME = 'admin-user';
    process.env.FIXED_LOGIN_PASSWORD = 'admin-password';
    process.env.FIXED_LOGIN_USER_ID = 'admin-user-id';
    process.env.LOGIN_USERNAME = 'admin-user';
    process.env.LOGIN_PASSWORD = 'admin-password';
    process.env.LOGIN_USER_ID = 'admin-user-id';

    jest.doMock('../../../src/app', () => jest.fn(() => ({
      locals: {
        ready: Promise.resolve(),
      },
      listen: listenMock,
    })));

    require('../../../src/server');
    await Promise.resolve();

    expect(listenMock).toHaveBeenCalledWith(3461, '0.0.0.0', expect.any(Function));
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('server.js 相当の初期化では non-production で SERVER_HOST=0.0.0.0 指定時に 127.0.0.1 へフォールバックする', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const listenMock = jest.fn((port, host, callback) => {
      callback();
      return { on: jest.fn() };
    });

    process.env.NODE_ENV = 'development';
    process.env.PORT = '3462';
    process.env.SERVER_HOST = '0.0.0.0';
    process.env.LOGIN_USERNAME = 'admin-user';
    process.env.LOGIN_PASSWORD = 'admin-password';
    process.env.LOGIN_USER_ID = 'admin-user-id';

    jest.doMock('../../../src/app', () => jest.fn(() => ({
      locals: {
        ready: Promise.resolve(),
      },
      listen: listenMock,
    })));

    require('../../../src/server');
    await Promise.resolve();

    expect(listenMock).toHaveBeenCalledWith(3462, '127.0.0.1', expect.any(Function));
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('server.js 相当の初期化では ENABLE_DEV_SESSION=true かつ loopback 以外の host 指定時に起動を中止する', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const listenMock = jest.fn((port, host, callback) => {
      callback();
      return { on: jest.fn() };
    });

    process.env.NODE_ENV = 'development';
    process.env.PORT = '3463';
    process.env.SERVER_HOST = '10.0.0.5';
    process.env.ENABLE_DEV_SESSION = 'true';
    process.env.DEV_SESSION_TOKEN = 'dev-token';
    process.env.DEV_SESSION_USER_ID = 'admin-dev';
    process.env.DEV_SESSION_TTL_MS = '60000';
    process.env.DEV_SESSION_PATHS = '/screen/entry';
    process.env.LOGIN_USERNAME = 'admin-user';
    process.env.LOGIN_PASSWORD = 'admin-password';
    process.env.LOGIN_USER_ID = 'admin-user-id';

    jest.doMock('../../../src/app', () => jest.fn(() => ({
      locals: {
        ready: Promise.resolve(),
      },
      listen: listenMock,
    })));

    require('../../../src/server');
    await Promise.resolve();

    expect(listenMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('サーバーの起動を中止しました: ENABLE_DEV_SESSION=true は loopback host 限定です'),
      expect.any(Error),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
