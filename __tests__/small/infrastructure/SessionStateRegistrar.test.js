const SessionStateRegistrar = require('../../../src/infrastructure/SessionStateRegistrar');

describe('SessionStateRegistrar', () => {
  const createSession = () => ({
    regenerate: jest.fn((callback) => callback()),
  });

  test('ログイン成功時にセッションIDをローテーションして session へ session_token を保存しストア登録できる', async () => {
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
    const session = createSession();

    const actual = await registrar.execute({
      session,
      userId: 'u1',
      ttlMs: 30000,
    });

    expect(session.regenerate).toHaveBeenCalledTimes(1);
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
    [{ session: {}, userId: 'u1', ttlMs: 30000 }, 'session.regenerate must be a function'],
    [{ session: createSession(), userId: '', ttlMs: 30000 }, 'userId must be a non-empty string'],
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
      session: createSession(),
      userId: 'u1',
      ttlMs: 30000,
    })).rejects.toThrow('sessionToken must be a non-empty string');
  });

  test('セッション再生成の完了後にストア保存と session_token 更新を行う', async () => {
    let regenerateSession;
    const session = {
      regenerate: jest.fn((callback) => {
        regenerateSession = callback;
      }),
    };
    const sessionStateStore = {
      save: jest.fn().mockResolvedValue({
        sessionToken: 'token-async',
        userId: 'u1',
        expiresAt: 1700000030000,
      }),
    };
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: jest.fn().mockReturnValue('token-async'),
    });

    const executePromise = registrar.execute({
      session,
      userId: 'u1',
      ttlMs: 30000,
    });

    expect(sessionStateStore.save).not.toHaveBeenCalled();
    expect(session.session_token).toBeUndefined();

    regenerateSession();

    await expect(executePromise).resolves.toEqual({
      sessionToken: 'token-async',
      userId: 'u1',
      expiresAt: 1700000030000,
    });
    expect(sessionStateStore.save).toHaveBeenCalledTimes(1);
    expect(session.session_token).toBe('token-async');
  });


  test('express-session のように regenerate 後に req.session が差し替わる場合は新しい session に session_token を保存する', async () => {
    const newSession = {};
    let regenerateSession;
    const session = {
      req: {
        session: null,
      },
      regenerate: jest.fn((callback) => {
        regenerateSession = callback;
      }),
    };
    const sessionStateStore = {
      save: jest.fn().mockResolvedValue({
        sessionToken: 'token-rotated',
        userId: 'u1',
        expiresAt: 1700000030000,
      }),
    };
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: jest.fn().mockReturnValue('token-rotated'),
    });

    const executePromise = registrar.execute({
      session,
      userId: 'u1',
      ttlMs: 30000,
    });

    session.req.session = newSession;
    regenerateSession();

    await expect(executePromise).resolves.toEqual({
      sessionToken: 'token-rotated',
      userId: 'u1',
      expiresAt: 1700000030000,
    });
    expect(newSession.session_token).toBe('token-rotated');
    expect(session.session_token).toBeUndefined();
  });

  test('セッション再生成が失敗した場合はストア保存と session_token 更新を行わない', async () => {
    const sessionStateStore = {
      save: jest.fn(),
    };
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: jest.fn().mockReturnValue('token-async'),
    });
    const session = {
      regenerate: jest.fn((callback) => callback(new Error('regenerate failed'))),
    };

    await expect(registrar.execute({
      session,
      userId: 'u1',
      ttlMs: 30000,
    })).rejects.toThrow('regenerate failed');
    expect(sessionStateStore.save).not.toHaveBeenCalled();
    expect(session.session_token).toBeUndefined();
  });

  test('非同期ストア保存が失敗した場合は session_token を更新しない', async () => {
    const sessionStateStore = {
      save: jest.fn().mockRejectedValue(new Error('save failed')),
    };
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: jest.fn().mockReturnValue('token-async'),
    });
    const session = createSession();

    await expect(registrar.execute({
      session,
      userId: 'u1',
      ttlMs: 30000,
    })).rejects.toThrow('save failed');
    expect(session.session_token).toBeUndefined();
  });
});
