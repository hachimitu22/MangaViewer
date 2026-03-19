const SessionStateAuthResolver = require('../../../src/infrastructure/SessionStateAuthResolver');

describe('SessionStateAuthResolver', () => {
  test('execute は sessionToken に紐づく userId を返す', async () => {
    const sessionStateStore = {
      findUserIdBySessionToken: jest.fn().mockReturnValue('u1'),
    };
    const resolver = new SessionStateAuthResolver({
      sessionStateStore,
    });

    await expect(resolver.execute('token-1')).resolves.toBe('u1');
    expect(sessionStateStore.findUserIdBySessionToken).toHaveBeenCalledWith('token-1');
  });

  test('sessionStateStore が不正な場合は初期化時に例外となる', () => {
    expect(() => {
      new SessionStateAuthResolver({
        sessionStateStore: {},
      });
    }).toThrow('sessionStateStore.findUserIdBySessionToken');
  });
});
