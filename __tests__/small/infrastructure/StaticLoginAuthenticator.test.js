const StaticLoginAuthenticator = require('../../../src/infrastructure/StaticLoginAuthenticator');

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
