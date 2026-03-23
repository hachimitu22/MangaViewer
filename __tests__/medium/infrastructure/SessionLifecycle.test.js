const SessionStateRegistrar = require('../../../src/infrastructure/SessionStateRegistrar');
const SessionTerminator = require('../../../src/infrastructure/SessionTerminator');

describe('Session lifecycle infrastructure (middle)', () => {
  test('normal: ログイン成功時にセッション再生成・保存・session_token 更新が連携する', async () => {
    const sessionStateStore = {
      save: jest.fn(async ({ sessionToken, userId, ttlMs }) => ({ sessionToken, userId, ttlMs })),
    };
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: () => 'token-001',
    });
    const session = {
      regenerate: jest.fn(callback => callback()),
    };

    await expect(registrar.execute({ session, userId: 'user-001', ttlMs: 60000 })).resolves.toEqual({
      sessionToken: 'token-001',
      userId: 'user-001',
      ttlMs: 60000,
    });
    expect(session.session_token).toBe('token-001');
  });

  test('business: session_token を無効化できない場合は destroy せず false を返す', async () => {
    const session = {
      session_token: 'token-001',
      destroy: jest.fn(callback => callback()),
    };
    const terminator = new SessionTerminator({
      sessionStateStore: {
        delete: jest.fn(() => false),
      },
    });

    await expect(terminator.execute({ session })).resolves.toBe(false);
    expect(session.destroy).not.toHaveBeenCalled();
  });

  test('technical: ストア保存失敗や destroy 失敗は例外として伝播する', async () => {
    const failingRegistrar = new SessionStateRegistrar({
      sessionStateStore: {
        save: jest.fn(async () => {
          throw new Error('save failed');
        }),
      },
      sessionTokenGenerator: () => 'token-001',
    });
    const session = {
      regenerate: jest.fn(callback => callback()),
    };

    await expect(failingRegistrar.execute({ session, userId: 'user-001', ttlMs: 60000 })).rejects.toThrow('save failed');
    expect(session.session_token).toBeUndefined();

    const terminator = new SessionTerminator({
      sessionStateStore: {
        delete: jest.fn(() => true),
      },
    });
    const destroyFailSession = {
      session_token: 'token-002',
      destroy: jest.fn(callback => callback(new Error('destroy failed'))),
    };

    await expect(terminator.execute({ session: destroyFailSession })).rejects.toThrow('destroy failed');
  });
});
