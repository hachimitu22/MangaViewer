const InMemorySessionStateStore = require('../../../src/infrastructure/InMemorySessionStateStore');

describe('InMemorySessionStateStore', () => {
  let now;
  let store;

  beforeEach(() => {
    now = 1700000000000;
    store = new InMemorySessionStateStore({
      clock: () => now,
    });
  });

  test('save したセッショントークンから userId を取得できる', () => {
    store.save({
      sessionToken: 'token-1',
      userId: 'u1',
      ttlMs: 30000,
    });

    expect(store.findUserIdBySessionToken('token-1')).toBe('u1');
  });

  test('TTL を過ぎたセッションは取得時に自動削除される', () => {
    store.save({
      sessionToken: 'token-1',
      userId: 'u1',
      ttlMs: 1000,
    });

    now += 1000;

    expect(store.findUserIdBySessionToken('token-1')).toBeUndefined();
  });

  test('delete は対象セッションを削除できる', () => {
    store.save({
      sessionToken: 'token-1',
      userId: 'u1',
      ttlMs: 30000,
    });

    expect(store.delete('token-1')).toBe(true);
    expect(store.findUserIdBySessionToken('token-1')).toBeUndefined();
  });

  test('purgeExpired は期限切れセッションのみ削除する', () => {
    store.save({
      sessionToken: 'token-1',
      userId: 'u1',
      ttlMs: 1000,
    });
    store.save({
      sessionToken: 'token-2',
      userId: 'u2',
      ttlMs: 5000,
    });

    now += 1001;
    store.purgeExpired();

    expect(store.findUserIdBySessionToken('token-1')).toBeUndefined();
    expect(store.findUserIdBySessionToken('token-2')).toBe('u2');
  });

  test.each([
    [{ sessionToken: '', userId: 'u1', ttlMs: 1000 }, 'sessionToken'],
    [{ sessionToken: 'token-1', userId: '', ttlMs: 1000 }, 'userId'],
    [{ sessionToken: 'token-1', userId: 'u1', ttlMs: 0 }, 'ttlMs'],
  ])('save の入力が不正な場合は例外となる: %s', (payload, expectedMessage) => {
    expect(() => store.save(payload)).toThrow(expectedMessage);
  });
});
