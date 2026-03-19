const SessionStateRegistrar = require('../../../src/infrastructure/SessionStateRegistrar');

describe('SessionStateRegistrar', () => {
  test('ログイン成功時に session へ session_token を保存しストア登録できる', () => {
    const sessionStateStore = {
      save: jest.fn().mockReturnValue({
        sessionToken: 'token-1',
        userId: 'u1',
        expiresAt: 1700000030000,
      }),
    };
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: jest.fn().mockReturnValue('token-1'),
    });
    const session = {};

    const actual = registrar.execute({
      session,
      userId: 'u1',
      ttlMs: 30000,
    });

    expect(sessionStateStore.save).toHaveBeenCalledWith({
      sessionToken: 'token-1',
      userId: 'u1',
      ttlMs: 30000,
    });
    expect(session.session_token).toBe('token-1');
    expect(actual).toEqual({
      sessionToken: 'token-1',
      userId: 'u1',
      expiresAt: 1700000030000,
    });
  });

  test.each([
    [{ session: null, userId: 'u1', ttlMs: 30000 }, 'session must be an object'],
    [{ session: {}, userId: '', ttlMs: 30000 }, 'userId must be a non-empty string'],
  ])('execute の入力が不正な場合は例外となる: %s', (payload, expectedMessage) => {
    const registrar = new SessionStateRegistrar({
      sessionStateStore: {
        save: jest.fn(),
      },
      sessionTokenGenerator: jest.fn().mockReturnValue('token-1'),
    });

    expect(() => registrar.execute(payload)).toThrow(expectedMessage);
  });

  test('sessionTokenGenerator が空文字を返す場合は例外となる', () => {
    const registrar = new SessionStateRegistrar({
      sessionStateStore: {
        save: jest.fn(),
      },
      sessionTokenGenerator: jest.fn().mockReturnValue(''),
    });

    expect(() => {
      registrar.execute({
        session: {},
        userId: 'u1',
        ttlMs: 30000,
      });
    }).toThrow('sessionToken must be a non-empty string');
  });
});
