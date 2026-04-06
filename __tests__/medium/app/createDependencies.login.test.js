const fs = require('fs');
const os = require('os');
const path = require('path');

const createDependencies = require('../../../src/app/createDependencies');
const { Query, LoginSucceededResult } = require('../../../src/application/user/command/LoginService');
const { hashPassword } = require('../../../src/infrastructure/auth/fixedUserPasswordHasher');

describe('createDependencies login wiring', () => {
  let dependencies;
  let databaseRoot;
  let contentRoot;

  beforeEach(() => {
    databaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-deps-login-db-'));
    contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-deps-login-content-'));

    dependencies = createDependencies({
      nodeEnv: 'test',
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

  test('passwordHash 指定時も認証できる', async () => {
    await dependencies.close();
    dependencies = createDependencies({
      nodeEnv: 'test',
      databaseStoragePath: path.join(databaseRoot, 'data.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'contents'),
      loginUsername: 'admin',
      loginPasswordHash: hashPassword('secret'),
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

  test('production 環境で loginUsername 未設定は起動エラーになる', () => {
    expect(() => createDependencies({
      nodeEnv: 'production',
      databaseStoragePath: path.join(databaseRoot, 'data.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'contents'),
      loginPassword: 'secret',
      loginUserId: 'user-001',
    })).toThrow('production環境では LOGIN_USERNAME (または FIXED_LOGIN_USERNAME) の設定が必須です。');
  });

  test('production 環境で loginPassword 未設定は起動エラーになる', () => {
    expect(() => createDependencies({
      nodeEnv: 'production',
      databaseStoragePath: path.join(databaseRoot, 'data.sqlite'),
      contentRootDirectory: path.join(contentRoot, 'contents'),
      loginUsername: 'admin',
      loginUserId: 'user-001',
    })).toThrow('production環境では LOGIN_PASSWORD (または FIXED_LOGIN_PASSWORD) の設定が必須です。');
  });
});
