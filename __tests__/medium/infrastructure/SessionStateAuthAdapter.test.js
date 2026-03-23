const SessionStateAuthAdapter = require('../../../src/infrastructure/SessionStateAuthAdapter');

describe('SessionStateAuthAdapter (middle)', () => {
  test('normal: sessionToken に紐づく userId を返す', async () => {
    const sessionStateStore = {
      findUserIdBySessionToken: jest.fn(token => (token === 'token-001' ? 'user-001' : null)),
    };
    const adapter = new SessionStateAuthAdapter({ sessionStateStore });

    await expect(adapter.execute('token-001')).resolves.toBe('user-001');
    expect(sessionStateStore.findUserIdBySessionToken).toHaveBeenCalledWith('token-001');
  });

  test('technical: 不正な sessionStateStore は初期化時に例外となる', () => {
    expect(() => new SessionStateAuthAdapter({ sessionStateStore: {} })).toThrow(
      'sessionStateStore.findUserIdBySessionToken must be a function'
    );
  });
});
