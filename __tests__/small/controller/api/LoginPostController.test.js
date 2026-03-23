const LoginPostController = require('../../../../src/controller/api/LoginPostController');
const {
  LoginSucceededResult,
  LoginFailedResult,
} = require('../../../../src/application/user/command/LoginService');

describe('LoginPostController', () => {
  let loginService;
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

  const execute = async ({ body, session }) => {
    const req = { body, session };
    const res = createRes();

    await controller.execute(req, res);

    return { req, res };
  };

  beforeEach(() => {
    loginService = {
      execute: jest.fn().mockResolvedValue(new LoginSucceededResult({ sessionToken: 'token-1' })),
    };
    controller = new LoginPostController({ loginService });
  });

  it('ログイン成功時はcookie付きでcode=0を返す', async () => {
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
    expect(res.cookie).toHaveBeenCalledWith('session_token', 'token-1', {
      httpOnly: true,
      path: '/',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 0 });
  });

  it('ログイン失敗時はcookieを発行せずcode=1を返す', async () => {
    loginService.execute.mockResolvedValue(new LoginFailedResult());

    const { res } = await execute({
      body: { username: 'admin', password: 'wrong' },
      session: { regenerate: jest.fn() },
    });

    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
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
});
