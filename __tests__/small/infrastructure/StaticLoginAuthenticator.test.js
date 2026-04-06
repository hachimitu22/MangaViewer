const StaticLoginAuthenticator = require('../../../src/infrastructure/StaticLoginAuthenticator');
const {
  BCRYPT_PBKDF_PREFIX,
  hashPassword,
} = require('../../../src/infrastructure/auth/fixedUserPasswordHasher');

describe('StaticLoginAuthenticator', () => {
  test('新方式ハッシュで固定認証情報と一致する場合は userId を返す', async () => {
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      password: 'secret',
      userId: 'user-1',
      passwordHashOptions: { bcryptCost: 4 },
    });

    await expect(authenticator.execute({
      username: 'admin',
      password: 'secret',
    })).resolves.toBe('user-1');
  });

  test('旧SHA-256ハッシュとの互換検証ができ、成功時に再ハッシュが行われる', async () => {
    const legacySha256Hash = '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b';
    const upgradedHashes = [];
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      passwordHash: legacySha256Hash,
      userId: 'user-1',
      passwordHashOptions: { bcryptCost: 4 },
      passwordHashUpdater: async payload => {
        upgradedHashes.push(payload);
      },
    });

    await expect(authenticator.execute({
      username: 'admin',
      password: 'secret',
    })).resolves.toBe('user-1');

    expect(upgradedHashes).toHaveLength(1);
    expect(upgradedHashes[0]).toEqual(expect.objectContaining({
      userId: 'user-1',
      username: 'admin',
      previousScheme: 'legacy-sha256',
      passwordHash: expect.stringContaining(BCRYPT_PBKDF_PREFIX),
    }));
  });

  test('不正パスワードは拒否される', async () => {
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      passwordHash: hashPassword('secret', { bcryptCost: 4 }),
      userId: 'user-1',
    });

    await expect(authenticator.execute({
      username: 'admin',
      password: 'wrong',
    })).resolves.toBeNull();
  });

  test.each([
    [{ username: '', password: 'secret', userId: 'user-1' }, 'username must be a non-empty string'],
    [{ username: 'admin', password: '', userId: 'user-1' }, 'password must be a non-empty string'],
    [{ username: 'admin', password: 'secret', userId: '' }, 'userId must be a non-empty string'],
    [{ username: null, password: 'secret', userId: 'user-1' }, 'username must be a non-empty string'],
    [{ username: 'admin', password: 'secret', userId: 'user-1', passwordHashUpdater: 'invalid' }, 'passwordHashUpdater must be a function'],
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
      passwordHashOptions: { bcryptCost: 4 },
    });

    await expect(authenticator.execute(payload)).resolves.toBeNull();
  });
});
