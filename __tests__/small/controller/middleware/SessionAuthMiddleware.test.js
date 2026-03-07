const SessionAuthMiddleware = require('../../../../src/controller/middleware/SessionAuthMiddleware');

describe('SessionAuthMiddleware', () => {
  let resolveUserIdBySessionToken;
  let logger;
  let middleware;

  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const execute = async ({ session, context, next = jest.fn() }) => {
    const req = { session, context };
    const res = createRes();

    await middleware.execute(req, res, next);

    return { req, res, next };
  };

  beforeEach(() => {
    resolveUserIdBySessionToken = jest.fn().mockResolvedValue('u1');
    logger = {
      warn: jest.fn(),
    };

    middleware = new SessionAuthMiddleware({
      resolveUserIdBySessionToken,
      logger,
    });
  });

  it('session_tokenが有効でuserIdを解決できる場合はnextへ委譲する', async () => {
    const { req, res, next } = await execute({
      session: { session_token: 'token1234' },
      context: {},
    });

    expect(resolveUserIdBySessionToken).toHaveBeenCalledWith('token1234');
    expect(req.context.userId).toBe('u1');
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('request.contextが未作成でも初期化してuserIdを設定できる', async () => {
    const { req, next } = await execute({
      session: { session_token: 'token1234' },
      context: undefined,
    });

    expect(req.context).toEqual({ userId: 'u1' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['req.sessionが未生成', undefined],
    ['session_tokenが未設定', {}],
    ['session_tokenがstring以外', { session_token: 1 }],
    ['session_tokenが空文字', { session_token: '' }],
  ])('%sの場合は401を返す', async (_name, session) => {
    const { req, res, next } = await execute({
      session,
      context: { userId: 'existing' },
    });

    expect(resolveUserIdBySessionToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '認証に失敗しました' });
    expect(req.context.userId).toBe('existing');
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('session_tokenは有効でもuserIdを解決できない場合は401を返す', async () => {
    resolveUserIdBySessionToken.mockResolvedValue('');

    const { req, res, next } = await execute({
      session: { session_token: 'token1234' },
      context: {},
    });

    expect(resolveUserIdBySessionToken).toHaveBeenCalledWith('token1234');
    expect(req.context.userId).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '認証に失敗しました' });
    expect(logger.warn).toHaveBeenCalledWith(
      'SessionAuthMiddleware authentication failed',
      expect.objectContaining({
        reason: 'user-not-resolved',
        sessionToken: 'to****34',
      }),
    );
  });

  it('想定外例外時も401を返しtokenの生値をログ出力しない', async () => {
    resolveUserIdBySessionToken.mockRejectedValue(new Error('boom'));

    const { res, next } = await execute({
      session: { session_token: 'raw-secret-token' },
      context: {},
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '認証に失敗しました' });

    expect(logger.warn).toHaveBeenCalledWith(
      'SessionAuthMiddleware authentication failed',
      expect.objectContaining({
        reason: 'unexpected-error',
      }),
    );

    const loggedMeta = logger.warn.mock.calls[0][1];
    expect(loggedMeta.sessionToken).not.toBe('raw-secret-token');
    expect(loggedMeta.sessionToken).toBe('ra****en');
  });
});
