const RedisSessionStateStore = require('../../../src/infrastructure/RedisSessionStateStore');

const createFakeRedis = () => {
  const data = new Map();
  return {
    async set(key, value) {
      data.set(key, value);
    },
    async get(key) {
      return data.get(key) || null;
    },
    async del(key) {
      const existed = data.has(key);
      data.delete(key);
      return existed ? 1 : 0;
    },
  };
};

describe('RedisSessionStateStore', () => {
  test('同一Redisを共有する複数インスタンス間でセッション参照/削除が一貫する', async () => {
    const redis = createFakeRedis();
    const writerStore = new RedisSessionStateStore({ redis, keyPrefix: 'session' });
    const readerStore = new RedisSessionStateStore({ redis, keyPrefix: 'session' });

    await writerStore.save({
      sessionToken: 'token-1',
      userId: 'user-1',
      ttlMs: 60_000,
    });

    await expect(readerStore.findUserIdBySessionToken('token-1')).resolves.toBe('user-1');

    await expect(readerStore.delete('token-1')).resolves.toBe(true);
    await expect(writerStore.findUserIdBySessionToken('token-1')).resolves.toBeUndefined();
  });
});
