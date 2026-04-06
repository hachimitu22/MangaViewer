const LoginPostController = require('../../../../src/controller/api/LoginPostController');
const {
  LoginSucceededResult,
  LoginFailedResult,
} = require('../../../../src/application/user/command/LoginService');

describe('LoginPostController', () => {
  let loginService;
  let loginAttemptStore;
  let controller;

  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const execute = async ({ body, session, env = {} }) => {
    const req = {
      body,
      session,
      app: {
        locals: {
          env,
        },
      },
    };
    const res = createRes();

    await controller.execute(req, res);

    return { req, res };
  };

  beforeEach(() => {
    loginService = {
      execute: jest.fn().mockResolvedValue(new LoginSucceededResult({ sessionToken: 'token-1' })),
    };
    loginAttemptStore = {
      getTemporaryLockState: jest.fn().mockReturnValue({ isLocked: false, failureCount: 0, lockUntilMs: 0 }),
      recordAuthenticationFailure: jest.fn().mockReturnValue({ failureCount: 1, lockUntilMs: 0, isLocked: false }),
      clearAuthenticationFailures: jest.fn(),
    };
    controller = new LoginPostController({ loginService, loginAttemptStore });
  });

  it('ログイン成功時はcookie付きでcode=0を返し失敗カウンタを解除する', async () => {
    const session = { regenerate: jest.fn() };
    const { res } = await execute({
      body: { username: 'admin', password: 'secret' },
      session,
    });

    expect(loginService.execute).toHaveBeenCalledTimes(1);
    expect(loginService.execute.mock.calls[0][0]).toMatchObject({
      username: 'admin',
      password: 'secret',
      session,
    });
    expect(loginAttemptStore.clearAuthenticationFailures).toHaveBeenCalledWith({ key: 'admin' });
    expect(res.cookie).toHaveBeenCalledWith('session_token', 'token-1', {
      httpOnly: true,
      path: '/',
      secure: false,
      sameSite: 'lax',
      maxAge: 86_400_000,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 0 });
  });

  it('ログイン失敗時は失敗カウンタを更新しcookieを発行せずcode=1を返す', async () => {
    loginService.execute.mockResolvedValue(new LoginFailedResult());

    const { res } = await execute({
      body: { username: 'admin', password: 'wrong' },
      session: { regenerate: jest.fn() },
    });

    expect(loginAttemptStore.recordAuthenticationFailure).toHaveBeenCalledWith({ key: 'admin' });
    expect(loginAttemptStore.clearAuthenticationFailures).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });

  it('一時ロック中は429で拒否する', async () => {
    loginAttemptStore.getTemporaryLockState.mockReturnValue({
      isLocked: true,
      failureCount: 4,
      lockUntilMs: Date.now() + 10_000,
    });

    const { res } = await execute({
      body: { username: 'admin', password: 'secret' },
      session: { regenerate: jest.fn() },
    });

    expect(loginService.execute).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });

  it.each([
    ['usernameが未設定', { password: 'secret' }, { regenerate: jest.fn() }],
    ['usernameが空文字', { username: '', password: 'secret' }, { regenerate: jest.fn() }],
    ['passwordが未設定', { username: 'admin' }, { regenerate: jest.fn() }],
    ['passwordが空文字', { username: 'admin', password: '' }, { regenerate: jest.fn() }],
    ['sessionが未設定', { username: 'admin', password: 'secret' }, undefined],
  ])('%sの場合はcode=1を返す', async (_name, body, session) => {
    const { res } = await execute({ body, session });

    expect(loginService.execute).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });

  it('サービス例外時もcode=1を返す', async () => {
    loginService.execute.mockRejectedValue(new Error('boom'));

    const { res } = await execute({
      body: { username: 'admin', password: 'secret' },
      session: { regenerate: jest.fn() },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });

  it('本番環境では secure=true / sameSite=strict / maxAge=セッションTTL を設定する', async () => {
    const session = { regenerate: jest.fn() };
    const { res } = await execute({
      body: { username: 'admin', password: 'secret' },
      session,
      env: {
        nodeEnv: 'production',
        loginSessionTtlMs: 120_000,
      },
    });

    expect(res.cookie).toHaveBeenCalledWith('session_token', 'token-1', {
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'strict',
      maxAge: 120_000,
    });
  });
});
