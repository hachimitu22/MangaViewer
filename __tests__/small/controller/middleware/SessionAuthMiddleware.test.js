const SessionAuthMiddleware = require('../../../../src/controller/middleware/SessionAuthMiddleware');

describe('SessionAuthMiddleware', () => {
  let authAdapter;
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
    authAdapter = {
      execute: jest.fn().mockResolvedValue('u1'),
    };

    middleware = new SessionAuthMiddleware(authAdapter);
  });

  it('session_tokenが有効でuserIdを解決できる場合はnextへ委譲する', async () => {
    const { req, res, next } = await execute({
      session: { session_token: 'token1234' },
      context: {},
    });

    expect(authAdapter.execute).toHaveBeenCalledWith('token1234');
    expect(req.context.userId).toBe('u1');
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
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

    expect(authAdapter.execute).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '認証に失敗しました' });
    expect(req.context.userId).toBe('existing');
  });

  it('session_tokenは有効でもuserIdを解決できない場合は401を返す', async () => {
    authAdapter.execute.mockResolvedValue('');

    const { req, res, next } = await execute({
      session: { session_token: 'token1234' },
      context: {},
    });

    expect(authAdapter.execute).toHaveBeenCalledWith('token1234');
    expect(req.context.userId).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '認証に失敗しました' });
  });

  it('想定外例外時も401を返す', async () => {
    authAdapter.execute.mockRejectedValue(new Error('boom'));

    const { res, next } = await execute({
      session: { session_token: 'raw-secret-token' },
      context: {},
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '認証に失敗しました' });
  });

  it('authAdapterが不正な場合は初期化時に例外となる', () => {
    expect(() => new SessionAuthMiddleware({})).toThrow('authAdapter.execute must be a function');
  });
});
