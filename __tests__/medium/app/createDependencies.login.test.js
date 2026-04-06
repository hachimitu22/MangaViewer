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

  test('production で認証設定が不足している場合は初期化失敗する', () => {
    expect(() => createDependencies({
      nodeEnv: 'production',
      databaseStoragePath: path.join(databaseRoot, 'production.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'production-contents'),
      loginUsername: 'admin',
      loginPassword: '',
      loginUserId: '',
    })).toThrow('本番環境ではログイン認証設定が必須です');
  });

  test('non-production で認証設定が不足していてもデフォルト資格情報でログインできる', async () => {
    if (dependencies) {
      await dependencies.close();
      dependencies = undefined;
    }

    dependencies = createDependencies({
      nodeEnv: 'development',
      databaseStoragePath: path.join(databaseRoot, 'development.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'development-contents'),
      loginUsername: '',
      loginPassword: '',
      loginUserId: '',
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
    await expect(dependencies.authResolver.execute(result.sessionToken)).resolves.toBe('admin');
  });
});
