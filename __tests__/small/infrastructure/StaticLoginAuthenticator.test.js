const crypto = require('crypto');

const StaticLoginAuthenticator = require('../../../src/infrastructure/StaticLoginAuthenticator');
const { hashPassword } = require('../../../src/infrastructure/auth/fixedUserPasswordHasher');

describe('StaticLoginAuthenticator', () => {
  test('固定認証情報と一致する場合は userId を返す', async () => {
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

  test('passwordHash(scrypt) を指定した場合も一致時に userId を返す', async () => {
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      passwordHash: hashPassword('secret'),
      userId: 'user-1',
    });

    await expect(authenticator.execute({
      username: 'admin',
      password: 'secret',
    })).resolves.toBe('user-1');
  });

  test('レガシー SHA-256 ハッシュ一致時は認証成功し、再ハッシュ通知を呼び出す', async () => {
    const onPasswordRehashRequired = jest.fn();
    const legacyHash = crypto.createHash('sha256').update('secret').digest('hex');
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      passwordHash: legacyHash,
      userId: 'user-1',
      onPasswordRehashRequired,
    });

    await expect(authenticator.execute({
      username: 'admin',
      password: 'secret',
    })).resolves.toBe('user-1');

    expect(onPasswordRehashRequired).toHaveBeenCalledTimes(1);
    const [event] = onPasswordRehashRequired.mock.calls[0];
    expect(event).toMatchObject({
      userId: 'user-1',
      username: 'admin',
      legacyFormat: 'legacy-sha256',
      legacyHash,
      upgradedHash: expect.stringMatching(/^\$scrypt\$N=/),
    });
  });

  test('固定認証情報と一致しない場合は null を返す', async () => {
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

  test.each([
    [{ username: '', password: 'secret', userId: 'user-1' }, 'username must be a non-empty string'],
    [{ username: 'admin', password: '', userId: 'user-1' }, 'password must be a non-empty string'],
    [{ username: 'admin', password: 'secret', userId: '' }, 'userId must be a non-empty string'],
    [{ username: null, password: 'secret', userId: 'user-1' }, 'username must be a non-empty string'],
    [{ username: 'admin', password: 'secret', userId: 'user-1', onPasswordRehashRequired: {} }, 'onPasswordRehashRequired must be a function'],
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
});
