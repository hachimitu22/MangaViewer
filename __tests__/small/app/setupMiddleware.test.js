const setupMiddleware = require('../../../src/app/setupMiddleware');

const createReq = ({
  headers = {},
  path = '/screen/entry',
  ip = '127.0.0.1',
} = {}) => ({
  path,
  originalUrl: path,
  method: 'GET',
  ip,
  socket: { remoteAddress: ip },
  header: name => headers[name.toLowerCase()],
  app: {
    locals: {
      dependencies: {
        logger: {
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
        },
      },
    },
  },
});

const createRes = () => ({
  locals: {},
  statusCode: 200,
  setHeader: jest.fn(),
  on: jest.fn((event, cb) => {
    if (event === 'finish') cb();
  }),
  cookie: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const createHarness = ({ env = {} } = {}) => {
  const middlewares = [];
  const app = {
    set: jest.fn(),
    use: jest.fn(handler => {
      middlewares.push(handler);
    }),
  };

  setupMiddleware(app, { env, dependencies: {} });

  return {
    app,
    middleware: middlewares[middlewares.length - 1],
  };
};

describe('setupMiddleware (small)', () => {
  test('csrf_token Cookie が存在する場合はセッションへ採用する', () => {
    const { middleware } = createHarness();
    const req = createReq({
      headers: {
        cookie: 'csrf_token=cookie-token',
      },
    });

    middleware(req, createRes(), jest.fn());

    expect(req.session.csrf_token).toBe('cookie-token');
  });

  test('csrf_token Cookie が無い場合は新規採番して Cookie 設定する', () => {
    const { middleware } = createHarness();
    const req = createReq();
    const res = createRes();

    middleware(req, res, jest.fn());

    expect(typeof req.session.csrf_token).toBe('string');
    expect(req.session.csrf_token.length).toBeGreaterThan(0);
    expect(res.cookie).toHaveBeenCalledWith(
      'csrf_token',
      req.session.csrf_token,
      expect.objectContaining({ path: '/', httpOnly: false }),
    );
  });

  test('req.session.regenerate/destroy の最小契約を満たす', () => {
    const { middleware } = createHarness();
    const req = createReq();

    middleware(req, createRes(), jest.fn());
    req.session.custom = 'kept';

    const regenerateCallback = jest.fn();
    req.session.regenerate(regenerateCallback);

    expect(regenerateCallback).toHaveBeenCalledWith(null);
    expect(req.session.custom).toBeUndefined();
    expect(req.session.req).toBe(req);

    req.session.custom = 'again';
    const destroyCallback = jest.fn();
    req.session.destroy(destroyCallback);

    expect(destroyCallback).toHaveBeenCalledWith(null);
    expect(req.session.custom).toBeUndefined();
    expect(req.session.req).toBe(req);
  });

  test('app.locals.env が未設定の場合は setupMiddleware に渡した env を公開する', () => {
    const app = {
      locals: {},
      set: jest.fn(),
      use: jest.fn(),
    };
    const env = {
      loginSessionTtlMs: 60_000,
    };

    setupMiddleware(app, { env, dependencies: {} });

    expect(app.locals.env).toBe(env);
  });

  test('全レスポンス共通のセキュリティヘッダーと nonce を設定する', () => {
    const { middleware } = createHarness({ env: {} });
    const req = createReq({ headers: {}, path: '/screen/entry' });
    const res = createRes();

    middleware(req, res, jest.fn());

    expect(typeof res.locals.cspNonce).toBe('string');
    expect(res.locals.cspNonce.length).toBeGreaterThan(0);
    expect(req.context.cspNonce).toBe(res.locals.cspNonce);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining(`script-src 'self' 'nonce-${res.locals.cspNonce}'`),
    );
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  });

  test('リクエスト開始/終了ログは actor=anonymous/screen で記録する', () => {
    const { middleware } = createHarness();
    const req = createReq({ path: '/screen/summary' });
    const res = createRes();

    middleware(req, res, jest.fn());

    expect(req.app.locals.dependencies.logger.debug).toHaveBeenCalledWith(
      'http.request.started',
      expect.objectContaining({
        actor: 'anonymous/screen',
        path: '/screen/summary',
      }),
    );
    expect(req.app.locals.dependencies.logger.info).toHaveBeenCalledWith(
      'http.request.completed',
      expect.objectContaining({
        actor: 'anonymous/screen',
        path: '/screen/summary',
      }),
    );
  });
});
