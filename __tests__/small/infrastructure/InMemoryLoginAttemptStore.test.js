const InMemoryLoginAttemptStore = require('../../../src/infrastructure/InMemoryLoginAttemptStore');

describe('InMemoryLoginAttemptStore', () => {
  test('レート制限カウンタはウィンドウ内で加算される', () => {
    const store = new InMemoryLoginAttemptStore();

    const first = store.consumeRateLimit({ scope: 'ip', key: '127.0.0.1', windowMs: 60_000, nowMs: 1_000 });
    const second = store.consumeRateLimit({ scope: 'ip', key: '127.0.0.1', windowMs: 60_000, nowMs: 2_000 });

    expect(first.count).toBe(1);
    expect(second.count).toBe(2);
    expect(second.resetAtMs).toBe(61_000);
  });

  test('失敗回数が閾値に達すると一時ロックされる', () => {
    const store = new InMemoryLoginAttemptStore();

    store.recordAuthenticationFailure({ key: 'admin', nowMs: 1_000, lockThreshold: 3, baseLockMs: 1_000 });
    store.recordAuthenticationFailure({ key: 'admin', nowMs: 2_000, lockThreshold: 3, baseLockMs: 1_000 });
    const third = store.recordAuthenticationFailure({ key: 'admin', nowMs: 3_000, lockThreshold: 3, baseLockMs: 1_000 });

    expect(third.isLocked).toBe(true);
    expect(third.lockUntilMs).toBe(4_000);
    expect(store.getTemporaryLockState({ key: 'admin', nowMs: 3_500 }).isLocked).toBe(true);
    expect(store.getTemporaryLockState({ key: 'admin', nowMs: 4_100 }).isLocked).toBe(false);
  });

  test('成功時に失敗カウンタをクリアできる', () => {
    const store = new InMemoryLoginAttemptStore();

    store.recordAuthenticationFailure({ key: 'admin', nowMs: 1_000 });
    store.clearAuthenticationFailures({ key: 'admin' });

    const lockState = store.getTemporaryLockState({ key: 'admin', nowMs: 2_000 });
    expect(lockState).toEqual({
      isLocked: false,
      failureCount: 0,
      lockUntilMs: 0,
    });
  });
});
