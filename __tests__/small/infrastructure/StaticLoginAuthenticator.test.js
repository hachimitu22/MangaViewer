const StaticLoginAuthenticator = require('../../../src/infrastructure/StaticLoginAuthenticator');
const {
  hashPassword,
  sha256Hex,
  detectHashScheme,
} = require('../../../src/infrastructure/auth/passwordHasher');

describe('StaticLoginAuthenticator', () => {
  test('新方式ハッシュで固定認証情報と一致する場合は userId を返す', async () => {
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      password: 'secret',
      userId: 'user-1',
    });

    await expect(authenticator.execute({
      username: 'admin',
      password: 'secret',
    })).resolves.toBe('user-1');
  });

  test('新方式ハッシュで固定認証情報と一致しない場合は null を返す', async () => {
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      password: 'secret',
      userId: 'user-1',
    });

    await expect(authenticator.execute({
      username: 'admin',
      password: 'wrong',
    })).resolves.toBeNull();
  });

  test('旧SHA-256ハッシュでも互換検証できる', async () => {
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      passwordHash: sha256Hex('secret'),
      userId: 'user-1',
    });

    await expect(authenticator.execute({
      username: 'admin',
      password: 'secret',
    })).resolves.toBe('user-1');
  });

  test('旧SHA-256検証成功時は再ハッシュをトリガーする', async () => {
    const onPasswordHashUpgrade = jest.fn();
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      passwordHash: sha256Hex('secret'),
      userId: 'user-1',
      onPasswordHashUpgrade,
      hashOptions: {
        memoryCost: 32_768,
        iterations: 16_384,
        parallelism: 1,
        timeCost: 8,
      },
    });

    await expect(authenticator.execute({
      username: 'admin',
      password: 'secret',
    })).resolves.toBe('user-1');

    expect(onPasswordHashUpgrade).toHaveBeenCalledTimes(1);
    expect(onPasswordHashUpgrade).toHaveBeenCalledWith(expect.objectContaining({
      username: 'admin',
      userId: 'user-1',
      reason: 'legacy-sha256-migrated',
      passwordHash: expect.any(String),
    }));
    const nextHash = onPasswordHashUpgrade.mock.calls[0][0].passwordHash;
    expect(detectHashScheme(nextHash)).toBe('scrypt');
  });

  test('旧SHA-256から再ハッシュ後はアップグレード通知を繰り返さない', async () => {
    const onPasswordHashUpgrade = jest.fn();
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      passwordHash: sha256Hex('secret'),
      userId: 'user-1',
      onPasswordHashUpgrade,
    });

    await authenticator.execute({ username: 'admin', password: 'secret' });
    await authenticator.execute({ username: 'admin', password: 'secret' });

    expect(onPasswordHashUpgrade).toHaveBeenCalledTimes(1);
  });

  test.each([
    [{ username: '', password: 'secret', userId: 'user-1' }, 'username must be a non-empty string'],
    [{ username: 'admin', password: '', userId: 'user-1' }, 'password must be a non-empty string'],
    [{ username: 'admin', password: 'secret', userId: '' }, 'userId must be a non-empty string'],
    [{ username: null, password: 'secret', userId: 'user-1' }, 'username must be a non-empty string'],
    [{ username: 'admin', password: 'secret', userId: 'user-1', onPasswordHashUpgrade: 'x' }, 'onPasswordHashUpgrade must be a function'],
  ])('コンストラクター設定が不正な場合は例外となる: %s', (payload, expectedMessage) => {
    expect(() => new StaticLoginAuthenticator(payload)).toThrow(expectedMessage);
  });

  test.each([
    [undefined],
    [{}],
    [{ username: undefined, password: 'secret' }],
    [{ username: 1, password: [] }],
  ])('execute に不足値や型不一致が渡された場合は認証失敗として null を返す: %s', async (payload) => {
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      password: 'secret',
      userId: 'user-1',
    });

    await expect(authenticator.execute(payload)).resolves.toBeNull();
  });

  test('不正パスワードは拒否される', async () => {
    const passwordHash = hashPassword('secret');
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      passwordHash,
      userId: 'user-1',
    });

    await expect(authenticator.execute({ username: 'admin', password: 'invalid' })).resolves.toBeNull();
  });
});
