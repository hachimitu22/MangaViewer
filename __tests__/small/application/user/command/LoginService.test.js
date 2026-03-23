const {
  Query,
  LoginService,
  LoginSucceededResult,
  LoginFailedResult,
} = require('../../../../../src/application/user/command/LoginService');

describe('LoginService', () => {
  test('認証成功時は成功結果とセッショントークンを返す', async () => {
    const loginAuthenticator = {
      execute: jest.fn().mockResolvedValue('user-001'),
    };
    const sessionStateRegistrar = {
      execute: jest.fn().mockResolvedValue({
        sessionToken: 'token-001',
        userId: 'user-001',
      }),
    };
    const service = new LoginService({
      loginAuthenticator,
      sessionStateRegistrar,
      sessionTtlMs: 60_000,
    });
    const query = new Query({
      username: 'admin',
      password: 'secret',
      session: { regenerate: jest.fn() },
    });

    const result = await service.execute(query);

    expect(loginAuthenticator.execute).toHaveBeenCalledWith({
      username: 'admin',
      password: 'secret',
    });
    expect(sessionStateRegistrar.execute).toHaveBeenCalledWith({
      session: query.session,
      userId: 'user-001',
      ttlMs: 60_000,
    });
    expect(result).toBeInstanceOf(LoginSucceededResult);
    expect(result.code).toBe(0);
    expect(result.sessionToken).toBe('token-001');
  });

  test('認証失敗時は失敗結果を返しセッション発行しない', async () => {
    const loginAuthenticator = {
      execute: jest.fn().mockResolvedValue(null),
    };
    const sessionStateRegistrar = {
      execute: jest.fn(),
    };
    const service = new LoginService({
      loginAuthenticator,
      sessionStateRegistrar,
    });

    const result = await service.execute(new Query({
      username: 'admin',
      password: 'wrong',
      session: { regenerate: jest.fn() },
    }));

    expect(loginAuthenticator.execute).toHaveBeenCalledWith({
      username: 'admin',
      password: 'wrong',
    });
    expect(sessionStateRegistrar.execute).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(LoginFailedResult);
    expect(result.code).toBe(1);
    expect(result.sessionToken).toBeNull();
  });

  test.each([
    [{ username: '', password: 'secret', session: { regenerate: jest.fn() } }, 'username must be a non-empty string'],
    [{ username: 'admin', password: '', session: { regenerate: jest.fn() } }, 'password must be a non-empty string'],
    [{ username: 'admin', password: 'secret', session: null }, 'session must be an object'],
  ])('入力が不正な場合は例外となる: %p', async (payload, expectedMessage) => {
    const loginAuthenticator = {
      execute: jest.fn(),
    };
    const sessionStateRegistrar = {
      execute: jest.fn(),
    };
    const service = new LoginService({
      loginAuthenticator,
      sessionStateRegistrar,
    });

    expect(() => new Query(payload)).toThrow(expectedMessage);
    expect(loginAuthenticator.execute).not.toHaveBeenCalled();
    expect(sessionStateRegistrar.execute).not.toHaveBeenCalled();

    await expect(service.execute(payload)).rejects.toThrow('query must be an instance of Query');
    expect(loginAuthenticator.execute).not.toHaveBeenCalled();
    expect(sessionStateRegistrar.execute).not.toHaveBeenCalled();
  });

  test('セッション発行失敗時は例外として扱う', async () => {
    const loginAuthenticator = {
      execute: jest.fn().mockResolvedValue('user-001'),
    };
    const sessionStateRegistrar = {
      execute: jest.fn().mockRejectedValue(new Error('session store failed')),
    };
    const service = new LoginService({
      loginAuthenticator,
      sessionStateRegistrar,
      sessionTtlMs: 120_000,
    });
    const query = new Query({
      username: 'admin',
      password: 'secret',
      session: { regenerate: jest.fn() },
    });

    await expect(service.execute(query)).rejects.toThrow('session store failed');
    expect(loginAuthenticator.execute).toHaveBeenCalledWith({
      username: 'admin',
      password: 'secret',
    });
    expect(sessionStateRegistrar.execute).toHaveBeenCalledWith({
      session: query.session,
      userId: 'user-001',
      ttlMs: 120_000,
    });
  });
});
