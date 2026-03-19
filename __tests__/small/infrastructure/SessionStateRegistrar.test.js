const SessionStateRegistrar = require('../../../src/infrastructure/SessionStateRegistrar');

describe('SessionStateRegistrar', () => {
  test('ログイン成功時に session へ session_token を保存しストア登録できる', async () => {
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

    const actual = await registrar.execute({
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
  ])('execute の入力が不正な場合は例外となる: %s', async (payload, expectedMessage) => {
    const registrar = new SessionStateRegistrar({
      sessionStateStore: {
        save: jest.fn(),
      },
      sessionTokenGenerator: jest.fn().mockReturnValue('token-1'),
    });

    await expect(registrar.execute(payload)).rejects.toThrow(expectedMessage);
  });

  test('sessionTokenGenerator が空文字を返す場合は例外となる', async () => {
    const registrar = new SessionStateRegistrar({
      sessionStateStore: {
        save: jest.fn(),
      },
      sessionTokenGenerator: jest.fn().mockReturnValue(''),
    });

    await expect(registrar.execute({
      session: {},
      userId: 'u1',
      ttlMs: 30000,
    })).rejects.toThrow('sessionToken must be a non-empty string');
  });

  test('非同期ストア保存の完了後に session_token を更新する', async () => {
    let resolveSave;
    const savePromise = new Promise((resolve) => {
      resolveSave = resolve;
    });
    const sessionStateStore = {
      save: jest.fn().mockReturnValue(savePromise),
    };
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: jest.fn().mockReturnValue('token-async'),
    });
    const session = {};

    const executePromise = registrar.execute({
      session,
      userId: 'u1',
      ttlMs: 30000,
    });

    expect(session.session_token).toBeUndefined();

    resolveSave({
      sessionToken: 'token-async',
      userId: 'u1',
      expiresAt: 1700000030000,
    });

    await expect(executePromise).resolves.toEqual({
      sessionToken: 'token-async',
      userId: 'u1',
      expiresAt: 1700000030000,
    });
    expect(session.session_token).toBe('token-async');
  });

  test('非同期ストア保存が失敗した場合は session_token を更新しない', async () => {
    const sessionStateStore = {
      save: jest.fn().mockRejectedValue(new Error('save failed')),
    };
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: jest.fn().mockReturnValue('token-async'),
    });
    const session = {};

    await expect(registrar.execute({
      session,
      userId: 'u1',
      ttlMs: 30000,
    })).rejects.toThrow('save failed');
    expect(session.session_token).toBeUndefined();
  });
});
