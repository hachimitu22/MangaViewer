const LogoutPostController = require('../../../../src/controller/api/LogoutPostController');
const {
  LogoutSucceededResult,
  LogoutFailedResult,
} = require('../../../../src/application/user/command/LogoutService');

describe('LogoutPostController', () => {
  let logoutService;
  let controller;

  const createRes = () => {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
      clearCookie: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };

  const execute = async ({ session }) => {
    const req = { session };
    const res = createRes();

    await controller.execute(req, res);

    return { req, res };
  };

  beforeEach(() => {
    logoutService = {
      execute: jest.fn().mockResolvedValue(new LogoutSucceededResult()),
    };
    controller = new LogoutPostController({ logoutService });
  });

  it('ログアウト成功時はcode=0を返す', async () => {
    const session = { session_token: 'token-1' };
    const { res } = await execute({ session });

    expect(logoutService.execute).toHaveBeenCalledTimes(1);
    expect(logoutService.execute.mock.calls[0][0]).toMatchObject({ session });
    expect(res.clearCookie).toHaveBeenCalledWith('session_token', expect.objectContaining({
      path: '/',
      sameSite: 'lax',
      secure: false,
    }));
    expect(res.clearCookie).toHaveBeenCalledWith('csrf_token', expect.objectContaining({
      path: '/',
      sameSite: 'lax',
      secure: false,
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 0 });
  });

  it('ログアウト失敗時はcode=1を返す', async () => {
    logoutService.execute.mockResolvedValue(new LogoutFailedResult());

    const { res } = await execute({ session: { session_token: 'token-1' } });

    expect(res.clearCookie).toHaveBeenCalledWith('session_token', expect.objectContaining({
      path: '/',
      sameSite: 'lax',
      secure: false,
    }));
    expect(res.clearCookie).toHaveBeenCalledWith('csrf_token', expect.objectContaining({
      path: '/',
      sameSite: 'lax',
      secure: false,
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 1 });
  });

  it('sessionが未設定の場合は401を返す', async () => {
    const { res } = await execute({ session: undefined });

    expect(logoutService.execute).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('session_token', expect.objectContaining({
      path: '/',
      sameSite: 'lax',
      secure: false,
    }));
    expect(res.clearCookie).toHaveBeenCalledWith('csrf_token', expect.objectContaining({
      path: '/',
      sameSite: 'lax',
      secure: false,
    }));
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '認証に失敗しました' });
  });

  it('サービス例外時は500を返す', async () => {
    logoutService.execute.mockRejectedValue(new Error('boom'));

    const { res } = await execute({ session: { session_token: 'token-1' } });

    expect(res.clearCookie).toHaveBeenCalledWith('session_token', expect.objectContaining({
      path: '/',
      sameSite: 'lax',
      secure: false,
    }));
    expect(res.clearCookie).toHaveBeenCalledWith('csrf_token', expect.objectContaining({
      path: '/',
      sameSite: 'lax',
      secure: false,
    }));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });

  it('production環境ではclearCookieにsameSite=strict, secure=trueを指定する', async () => {
    const req = {
      session: { session_token: 'token-1' },
      app: { locals: { env: { nodeEnv: 'production' } } },
    };
    const res = createRes();

    await controller.execute(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith('session_token', expect.objectContaining({
      path: '/',
      sameSite: 'strict',
      secure: true,
    }));
    expect(res.clearCookie).toHaveBeenCalledWith('csrf_token', expect.objectContaining({
      path: '/',
      sameSite: 'strict',
      secure: true,
    }));
  });
});
