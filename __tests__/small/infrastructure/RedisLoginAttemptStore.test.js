const RedisLoginAttemptStore = require('../../../src/infrastructure/RedisLoginAttemptStore');

const createFakeRedis = () => {
  const counters = new Map();
  const failures = new Map();

  return {
    async eval(script, { keys, arguments: args }) {
      const key = keys[0];
      if (script.includes("redis.call('INCR'")) {
        const ttlMs = Number.parseInt(args[0], 10);
        const state = counters.get(key) || { count: 0, ttlMs };
        state.count += 1;
        state.ttlMs = ttlMs;
        counters.set(key, state);
        return [state.count, state.ttlMs];
      }

      if (script.includes("redis.call('HSET'")) {
        const nowMs = Number.parseInt(args[0], 10);
        const lockThreshold = Number.parseInt(args[1], 10);
        const baseLockMs = Number.parseInt(args[2], 10);
        const maxLockMs = Number.parseInt(args[3], 10);
        const current = failures.get(key) || { failureCount: 0, lockUntilMs: 0 };
        const failureCount = current.failureCount + 1;
        let lockUntilMs = current.lockUntilMs;

        if (failureCount >= lockThreshold) {
          const exponent = failureCount - lockThreshold;
          const lockMs = Math.min(baseLockMs * (2 ** exponent), maxLockMs);
          lockUntilMs = nowMs + lockMs;
        }

        failures.set(key, { failureCount, lockUntilMs });
        const isLocked = nowMs < lockUntilMs ? 1 : 0;
        return [failureCount, lockUntilMs, isLocked];
      }

      throw new Error('unsupported script');
    },

    async del(key) {
      counters.delete(key);
      failures.delete(key);
      return 1;
    },

    async hGetAll(key) {
      const state = failures.get(key);
      if (!state) {
        return {};
      }

      return {
        failure_count: String(state.failureCount),
        lock_until_ms: String(state.lockUntilMs),
      };
    },
  };
};

describe('RedisLoginAttemptStore', () => {
  test('同一Redisを共有する複数インスタンス間でロック状態が一貫する', async () => {
    const redis = createFakeRedis();
    const first = new RedisLoginAttemptStore({ redis, keyPrefix: 'auth' });
    const second = new RedisLoginAttemptStore({ redis, keyPrefix: 'auth' });

    await first.recordAuthenticationFailure({
      key: 'admin',
      nowMs: 1_000,
      lockThreshold: 2,
      baseLockMs: 1_000,
      maxLockMs: 8_000,
    });
    const secondFailure = await second.recordAuthenticationFailure({
      key: 'admin',
      nowMs: 1_001,
      lockThreshold: 2,
      baseLockMs: 1_000,
      maxLockMs: 8_000,
    });

    expect(secondFailure.isLocked).toBe(true);
    expect(secondFailure.failureCount).toBe(2);

    const lockState = await first.getTemporaryLockState({ key: 'admin', nowMs: 1_002 });
    expect(lockState.isLocked).toBe(true);
    expect(lockState.failureCount).toBe(2);
  });

  test('レート制限カウンタは同一キーで共有される', async () => {
    const redis = createFakeRedis();
    const first = new RedisLoginAttemptStore({ redis, keyPrefix: 'auth' });
    const second = new RedisLoginAttemptStore({ redis, keyPrefix: 'auth' });

    const firstResult = await first.consumeRateLimit({ scope: 'ip', key: '127.0.0.1', windowMs: 60_000, nowMs: 100 });
    const secondResult = await second.consumeRateLimit({ scope: 'ip', key: '127.0.0.1', windowMs: 60_000, nowMs: 101 });

    expect(firstResult.count).toBe(1);
    expect(secondResult.count).toBe(2);
  });

  test('scopeごとに独立したレート制限カウンタを共有できる', async () => {
    const redis = createFakeRedis();
    const first = new RedisLoginAttemptStore({ redis, keyPrefix: 'auth' });
    const second = new RedisLoginAttemptStore({ redis, keyPrefix: 'auth' });

    const ipFirst = await first.consumeRateLimit({ scope: 'ip', key: '127.0.0.1', windowMs: 60_000, nowMs: 100 });
    const accountFirst = await second.consumeRateLimit({ scope: 'account', key: 'admin', windowMs: 60_000, nowMs: 101 });
    const ipSecond = await second.consumeRateLimit({ scope: 'ip', key: '127.0.0.1', windowMs: 60_000, nowMs: 102 });

    expect(ipFirst.count).toBe(1);
    expect(accountFirst.count).toBe(1);
    expect(ipSecond.count).toBe(2);
  });

});
