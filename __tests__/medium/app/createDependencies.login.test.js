const fs = require('fs');
const os = require('os');
const path = require('path');

const createDependencies = require('../../../src/app/createDependencies');
const { Query, LoginSucceededResult } = require('../../../src/application/user/command/LoginService');

describe('createDependencies login wiring', () => {
  let dependencies;
  let databaseRoot;
  let contentRoot;

  beforeEach(() => {
    databaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-deps-login-db-'));
    contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-deps-login-content-'));

    dependencies = createDependencies({
      databaseStoragePath: path.join(databaseRoot, 'data.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'contents'),
      loginUsername: 'admin',
      loginPassword: 'secret',
      loginUserId: 'user-001',
      loginSessionTtlMs: 60_000,
    });
  });

  afterEach(async () => {
    if (dependencies) {
      await dependencies.close();
      dependencies = undefined;
    }

    fs.rmSync(databaseRoot, { recursive: true, force: true });
    fs.rmSync(contentRoot, { recursive: true, force: true });
  });

  test('依存性配線を通した loginService でログインが成立し認証状態を参照できる', async () => {
    await dependencies.ready;

    const session = {
      regenerate: jest.fn((callback) => callback()),
    };
    const query = new Query({
      username: 'admin',
      password: 'secret',
      session,
    });

    const result = await dependencies.loginService.execute(query);

    expect(result).toBeInstanceOf(LoginSucceededResult);
    expect(result.code).toBe(0);
    expect(result.sessionToken).toEqual(expect.stringMatching(/^[0-9a-f]{32}$/));
    expect(session.session_token).toBe(result.sessionToken);

    await expect(dependencies.authResolver.execute(result.sessionToken)).resolves.toBe('user-001');
  });

  test('認証設定が不足している場合は環境を問わず初期化失敗する', () => {
    expect(() => createDependencies({
      nodeEnv: 'development',
      databaseStoragePath: path.join(databaseRoot, 'production.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'production-contents'),
      loginUsername: 'admin',
      loginPassword: '',
      loginUserId: '',
    })).toThrow('ログイン認証設定が不足しています');
  });


  test('passwordHash 指定時は平文パスワード未設定でもログインできる', async () => {
    if (dependencies) {
      await dependencies.close();
      dependencies = undefined;
    }

    const { sha256Hex } = require('../../../src/infrastructure/auth/passwordHasher');
    dependencies = createDependencies({
      nodeEnv: 'production',
      databaseStoragePath: path.join(databaseRoot, 'hashed.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'hashed-contents'),
      loginUsername: 'admin',
      loginPasswordHash: sha256Hex('secret'),
      loginUserId: 'user-001',
      loginSessionTtlMs: 60_000,
    });
    await dependencies.ready;

    const session = {
      regenerate: jest.fn((callback) => callback()),
    };

    const result = await dependencies.loginService.execute(new Query({
      username: 'admin',
      password: 'secret',
      session,
    }));

    expect(result).toBeInstanceOf(LoginSucceededResult);
  });

  test('ALLOW_INSECURE_DEFAULT_LOGIN=true は development でも拒否して初期化失敗する', () => {
    expect(() => createDependencies({
      nodeEnv: 'development',
      allowInsecureDefaultLogin: 'true',
      databaseStoragePath: path.join(databaseRoot, 'development.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'development-contents'),
      loginUsername: '',
      loginPassword: '',
      loginUserId: '',
    })).toThrow('ALLOW_INSECURE_DEFAULT_LOGIN=true は許可できません');
  });

  test('production では ALLOW_INSECURE_DEFAULT_LOGIN=true を拒否して初期化失敗する', () => {
    expect(() => createDependencies({
      nodeEnv: 'production',
      allowInsecureDefaultLogin: 'true',
      databaseStoragePath: path.join(databaseRoot, 'production-insecure.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'production-insecure-contents'),
      loginUsername: '',
      loginPassword: '',
      loginUserId: '',
    })).toThrow('ALLOW_INSECURE_DEFAULT_LOGIN=true は許可できません');
  });

  test('既知の弱い固定パスワードは拒否して初期化失敗する', () => {
    expect(() => createDependencies({
      nodeEnv: 'production',
      databaseStoragePath: path.join(databaseRoot, 'weak-password.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'weak-password-contents'),
      loginUsername: 'admin',
      loginPassword: 'admin',
      loginUserId: 'user-001',
    })).toThrow('既知の弱いパスワードは使用できません');
  });

  test('development では既存のテスト互換のため弱い固定パスワードを許容する', async () => {
    if (dependencies) {
      await dependencies.close();
      dependencies = undefined;
    }

    dependencies = createDependencies({
      nodeEnv: 'development',
      databaseStoragePath: path.join(databaseRoot, 'weak-password-development.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'weak-password-development-contents'),
      loginUsername: 'admin',
      loginPassword: 'admin',
      loginUserId: 'admin',
      loginSessionTtlMs: 60_000,
    });
    await dependencies.ready;

    const session = {
      regenerate: jest.fn((callback) => callback()),
    };

    const result = await dependencies.loginService.execute(new Query({
      username: 'admin',
      password: 'admin',
      session,
    }));

    expect(result).toBeInstanceOf(LoginSucceededResult);
  });

  test('AUTH_STATE_STORE_BACKEND=memory では InMemory ストアを利用する', async () => {
    if (dependencies) {
      await dependencies.close();
      dependencies = undefined;
    }

    dependencies = createDependencies({
      databaseStoragePath: path.join(databaseRoot, 'memory.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'memory-contents'),
      loginUsername: 'admin',
      loginPassword: 'secret',
      loginUserId: 'user-001',
      authStateStoreBackend: 'memory',
    });

    await dependencies.ready;
    expect(dependencies.authStateStoreBackend).toBe('memory');
  });

  test('AUTH_STATE_STORE_BACKEND=redis かつ redis パッケージ未導入時は初期化時に失敗する', () => {
    expect(() => createDependencies({
      databaseStoragePath: path.join(databaseRoot, 'redis.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'redis-contents'),
      loginUsername: 'admin',
      loginPassword: 'secret',
      loginUserId: 'user-001',
      authStateStoreBackend: 'redis',
      redisUrl: 'redis://127.0.0.1:6379',
    })).toThrow('redis パッケージ');
  });

});
