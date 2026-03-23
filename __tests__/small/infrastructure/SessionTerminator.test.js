const SessionTerminator = require('../../../src/infrastructure/SessionTerminator');

describe('SessionTerminator', () => {
  test('session_token を無効化して session.destroy を呼ぶ', async () => {
    const sessionStateStore = {
      delete: jest.fn().mockReturnValue(true),
    };
    const terminator = new SessionTerminator({ sessionStateStore });
    const session = {
      session_token: 'token-1',
      destroy: jest.fn(callback => callback(null)),
    };

    await expect(terminator.execute({ session })).resolves.toBe(true);
    expect(sessionStateStore.delete).toHaveBeenCalledWith('token-1');
    expect(session.destroy).toHaveBeenCalledTimes(1);
  });

  test('ストア削除に失敗した場合は false を返して session.destroy を呼ばない', async () => {
    const sessionStateStore = {
      delete: jest.fn().mockReturnValue(false),
    };
    const terminator = new SessionTerminator({ sessionStateStore });
    const session = {
      session_token: 'token-1',
      destroy: jest.fn(),
    };

    await expect(terminator.execute({ session })).resolves.toBe(false);
    expect(session.destroy).not.toHaveBeenCalled();
  });

  test('session.destroy が失敗した場合は reject する', async () => {
    const terminator = new SessionTerminator({
      sessionStateStore: {
        delete: jest.fn().mockReturnValue(true),
      },
    });
    const session = {
      session_token: 'token-1',
      destroy: jest.fn(callback => callback(new Error('destroy failed'))),
    };

    await expect(terminator.execute({ session })).rejects.toThrow('destroy failed');
  });
});
