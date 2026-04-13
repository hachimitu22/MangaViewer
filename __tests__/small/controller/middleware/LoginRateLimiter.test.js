const LoginRateLimiter = require('../../../../src/controller/middleware/LoginRateLimiter');
const InMemoryLoginAttemptStore = require('../../../../src/infrastructure/InMemoryLoginAttemptStore');

describe('LoginRateLimiter', () => {
  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  test('同一IPで上限超過時は429を返す', async () => {
    const loginAttemptStore = {
      consumeRateLimit: jest.fn()
        .mockReturnValueOnce({ count: 5, resetAtMs: Date.now() + 10_000 })
        .mockReturnValueOnce({ count: 1, resetAtMs: Date.now() + 10_000 })
        .mockReturnValueOnce({ count: 6, resetAtMs: Date.now() + 10_000 }),
    };
    const middleware = new LoginRateLimiter({
      loginAttemptStore,
      maxAttemptsPerWindow: 5,
      windowMs: 60_000,
    });
    const next = jest.fn();

    const firstRes = createRes();
    await middleware.execute({ ip: '127.0.0.1', body: { username: 'admin' } }, firstRes, next);
    expect(next).toHaveBeenCalledTimes(1);

    const secondRes = createRes();
    await middleware.execute({ ip: '127.0.0.1', body: { username: 'admin' } }, secondRes, next);
    expect(secondRes.status).toHaveBeenCalledWith(429);
    expect(secondRes.json).toHaveBeenCalledWith({ code: 1 });
  });

  test('同一IPでusernameを回転してもIPスコープ制限を回避できない', async () => {
    const loginAttemptStore = new InMemoryLoginAttemptStore();
    const middleware = new LoginRateLimiter({
      loginAttemptStore,
      maxAttemptsPerWindow: 1,
      windowMs: 60_000,
    });

    const firstRes = createRes();
    const firstNext = jest.fn();
    await middleware.execute({ ip: '127.0.0.1', body: { username: 'alice' } }, firstRes, firstNext);
    expect(firstNext).toHaveBeenCalledTimes(1);

    const secondRes = createRes();
    const secondNext = jest.fn();
    await middleware.execute({ ip: '127.0.0.1', body: { username: 'bob' } }, secondRes, secondNext);
    expect(secondNext).not.toHaveBeenCalled();
    expect(secondRes.status).toHaveBeenCalledWith(429);
  });

  test('同一アカウントでIPを変えてもaccountスコープ制限を回避できない', async () => {
    const loginAttemptStore = new InMemoryLoginAttemptStore();
    const middleware = new LoginRateLimiter({
      loginAttemptStore,
      maxAttemptsPerWindow: 1,
      windowMs: 60_000,
    });

    const firstRes = createRes();
    const firstNext = jest.fn();
    await middleware.execute({ ip: '127.0.0.1', body: { username: 'alice' } }, firstRes, firstNext);
    expect(firstNext).toHaveBeenCalledTimes(1);

    const secondRes = createRes();
    const secondNext = jest.fn();
    await middleware.execute({ ip: '127.0.0.2', body: { username: 'alice' } }, secondRes, secondNext);
    expect(secondNext).not.toHaveBeenCalled();
    expect(secondRes.status).toHaveBeenCalledWith(429);
  });

  test('認証成功が連続する想定では毎回nextへ進み429にならない', async () => {
    const loginAttemptStore = {
      consumeRateLimit: jest.fn().mockReturnValue({ count: 1, resetAtMs: Date.now() + 60_000 }),
    };
    const middleware = new LoginRateLimiter({
      loginAttemptStore,
      maxAttemptsPerWindow: 5,
      windowMs: 60_000,
    });

    for (let i = 0; i < 8; i += 1) {
      const res = createRes();
      const next = jest.fn();
      await middleware.execute({ ip: '127.0.0.1', body: { username: 'admin' } }, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalledWith(429);
    }
  });

  test('ストア障害時に fail_open を選択している場合は監査ログを残しつつ next へ進む', async () => {
    const logger = { warn: jest.fn() };
    const middleware = new LoginRateLimiter({
      loginAttemptStore: {
        consumeRateLimit: jest.fn().mockRejectedValue(new Error('redis unavailable')),
      },
      maxAttemptsPerWindow: 1,
      windowMs: 60_000,
    });
    const req = {
      ip: '127.0.0.1',
      body: { username: 'admin' },
      app: {
        locals: {
          env: { authStoreFailurePolicy: 'fail_open' },
          dependencies: { logger },
        },
      },
    };
    const res = createRes();
    const next = jest.fn();

    await middleware.execute(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'auth.login.failed',
      expect.objectContaining({ reason: 'rate_limit_store_unavailable', store_failure_policy: 'fail_open', scope: 'ip' }),
    );
  });
});
