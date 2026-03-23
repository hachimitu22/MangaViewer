const InMemorySessionStateStore = require('../../../src/infrastructure/InMemorySessionStateStore');
const SessionStateRegistrar = require('../../../src/infrastructure/SessionStateRegistrar');
const SessionTerminator = require('../../../src/infrastructure/SessionTerminator');
const SessionStateAuthAdapter = require('../../../src/infrastructure/SessionStateAuthAdapter');
const StaticLoginAuthenticator = require('../../../src/infrastructure/StaticLoginAuthenticator');

describe('session infrastructure adapters (medium)', () => {
  const createSession = () => ({
    regenerate: jest.fn(callback => callback()),
    destroy: jest.fn(callback => callback()),
  });

  test('normal: StaticLoginAuthenticator → SessionStateRegistrar → SessionStateAuthAdapter で userId を解決できる', async () => {
    const sessionStateStore = new InMemorySessionStateStore();
    const authenticator = new StaticLoginAuthenticator({
      username: 'admin',
      password: 'secret',
      userId: 'user-001',
    });
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: () => 'token-001',
    });
    const adapter = new SessionStateAuthAdapter({ sessionStateStore });
    const session = createSession();

    const userId = await authenticator.execute({ username: 'admin', password: 'secret' });
    await registrar.execute({ session, userId, ttlMs: 60_000 });

    await expect(adapter.execute(session.session_token)).resolves.toBe('user-001');
  });

  test('normal: SessionTerminator 実行後は同じトークンを解決できない', async () => {
    const sessionStateStore = new InMemorySessionStateStore();
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: () => 'token-logout',
    });
    const terminator = new SessionTerminator({ sessionStateStore });
    const adapter = new SessionStateAuthAdapter({ sessionStateStore });
    const session = createSession();

    await registrar.execute({ session, userId: 'user-logout', ttlMs: 60_000 });
    await expect(adapter.execute('token-logout')).resolves.toBe('user-logout');

    await expect(terminator.execute({ session })).resolves.toBe(true);
    await expect(adapter.execute('token-logout')).resolves.toBeUndefined();
  });

  test('business: TTL 経過後または明示失効後はアダプタ解決結果へ反映される', async () => {
    let now = 1_000;
    const sessionStateStore = new InMemorySessionStateStore({
      clock: () => now,
    });
    const adapter = new SessionStateAuthAdapter({ sessionStateStore });

    sessionStateStore.save({ sessionToken: 'ttl-token', userId: 'user-ttl', ttlMs: 100 });
    await expect(adapter.execute('ttl-token')).resolves.toBe('user-ttl');

    now = 1_100;
    await expect(adapter.execute('ttl-token')).resolves.toBeUndefined();

    sessionStateStore.save({ sessionToken: 'revoked-token', userId: 'user-revoked', ttlMs: 100 });
    await expect(adapter.execute('revoked-token')).resolves.toBe('user-revoked');

    sessionStateStore.delete('revoked-token');
    await expect(adapter.execute('revoked-token')).resolves.toBeUndefined();
  });

  test('technical: 非同期失敗時も保存状態や session_token が中途半端に残らない', async () => {
    const sessionStateStore = new InMemorySessionStateStore();
    const adapter = new SessionStateAuthAdapter({ sessionStateStore });

    const regenerateFailureSession = {
      regenerate: jest.fn(callback => callback(new Error('regenerate failed'))),
    };
    const registrar = new SessionStateRegistrar({
      sessionStateStore,
      sessionTokenGenerator: () => 'token-regenerate-fail',
    });

    await expect(
      registrar.execute({ session: regenerateFailureSession, userId: 'user-001', ttlMs: 60_000 })
    ).rejects.toThrow('regenerate failed');
    expect(regenerateFailureSession.session_token).toBeUndefined();
    await expect(adapter.execute('token-regenerate-fail')).resolves.toBeUndefined();

    const saveFailureStore = {
      save: jest.fn(async () => {
        throw new Error('save failed');
      }),
      findUserIdBySessionToken: jest.fn(() => undefined),
    };
    const failingRegistrar = new SessionStateRegistrar({
      sessionStateStore: saveFailureStore,
      sessionTokenGenerator: () => 'token-save-fail',
    });
    const saveFailureSession = createSession();

    await expect(
      failingRegistrar.execute({ session: saveFailureSession, userId: 'user-002', ttlMs: 60_000 })
    ).rejects.toThrow('save failed');
    expect(saveFailureSession.session_token).toBeUndefined();
    expect(saveFailureStore.findUserIdBySessionToken('token-save-fail')).toBeUndefined();
  });
});
