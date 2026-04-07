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

  test('同一IPで上限超過時は429を返す', () => {
    const loginAttemptStore = {
      consumeRateLimit: jest.fn()
        .mockReturnValueOnce({ count: 5, resetAtMs: Date.now() + 10_000 })
        .mockReturnValueOnce({ count: 6, resetAtMs: Date.now() + 10_000 }),
    };
    const middleware = new LoginRateLimiter({
      loginAttemptStore,
      maxAttemptsPerWindow: 5,
      windowMs: 60_000,
    });
    const next = jest.fn();

    const firstRes = createRes();
    middleware.execute({ ip: '127.0.0.1', body: { username: 'admin' } }, firstRes, next);
    expect(next).toHaveBeenCalledTimes(1);

    const secondRes = createRes();
    middleware.execute({ ip: '127.0.0.1', body: { username: 'admin' } }, secondRes, next);
    expect(secondRes.status).toHaveBeenCalledWith(429);
    expect(secondRes.json).toHaveBeenCalledWith({ code: 1 });
  });

  test('同一IPでもユーザーが異なる試行は別キーとして扱う', () => {
    const loginAttemptStore = new InMemoryLoginAttemptStore();
    const middleware = new LoginRateLimiter({
      loginAttemptStore,
      maxAttemptsPerWindow: 1,
      windowMs: 60_000,
    });

    const firstRes = createRes();
    const firstNext = jest.fn();
    middleware.execute({ ip: '127.0.0.1', body: { username: 'alice' } }, firstRes, firstNext);
    expect(firstNext).toHaveBeenCalledTimes(1);

    const secondRes = createRes();
    const secondNext = jest.fn();
    middleware.execute({ ip: '127.0.0.1', body: { username: 'bob' } }, secondRes, secondNext);
    expect(secondNext).toHaveBeenCalledTimes(1);
    expect(secondRes.status).not.toHaveBeenCalledWith(429);

    const thirdRes = createRes();
    const thirdNext = jest.fn();
    middleware.execute({ ip: '127.0.0.1', body: { username: 'alice' } }, thirdRes, thirdNext);
    expect(thirdNext).not.toHaveBeenCalled();
    expect(thirdRes.status).toHaveBeenCalledWith(429);
  });

  test('認証成功が連続する想定では毎回nextへ進み429にならない', () => {
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
      middleware.execute({ ip: '127.0.0.1', body: { username: 'admin' } }, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalledWith(429);
    }
  });
});
