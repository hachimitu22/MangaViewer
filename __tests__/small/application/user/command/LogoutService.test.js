const {
  Query,
  LogoutService,
  LogoutSucceededResult,
  LogoutFailedResult,
} = require('../../../../../src/application/user/command/LogoutService');

describe('LogoutService', () => {
  test('sessionTerminator 成功時は成功結果を返す', async () => {
    const sessionTerminator = {
      execute: jest.fn().mockResolvedValue(true),
    };
    const service = new LogoutService({ sessionTerminator });
    const query = new Query({ session: { session_token: 'token-1' } });

    const result = await service.execute(query);

    expect(sessionTerminator.execute).toHaveBeenCalledWith({
      session: query.session,
    });
    expect(result).toBeInstanceOf(LogoutSucceededResult);
    expect(result.code).toBe(0);
  });

  test('sessionTerminator 失敗時は失敗結果を返す', async () => {
    const service = new LogoutService({
      sessionTerminator: {
        execute: jest.fn().mockResolvedValue(false),
      },
    });

    await expect(service.execute(new Query({ session: {} }))).resolves.toBeInstanceOf(LogoutFailedResult);
  });

  test('Query 以外は例外となる', async () => {
    const service = new LogoutService({
      sessionTerminator: {
        execute: jest.fn(),
      },
    });

    await expect(service.execute({ session: {} })).rejects.toThrow('query must be an instance of Query');
  });
});
