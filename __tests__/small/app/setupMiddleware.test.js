const setupMiddleware = require('../../../src/app/setupMiddleware');

const createReq = ({
  headers = {},
  path = '/screen/entry',
  ip = '127.0.0.1',
} = {}) => ({
  path,
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
  setHeader: jest.fn(),
  on: jest.fn(),
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
  test.each([
    {
      title: 'session_token Cookie が存在する場合は採用する',
      headers: {
        cookie: 'session_token=cookie-token',
      },
      expected: 'cookie-token',
    },
    {
      title: 'Cookie が無い場合は開発用固定セッションを採用する',
      headers: {},
      expected: 'dev-token',
    },
  ])('セッショントークン解決優先順位: $title', ({ headers, expected }) => {
    const { middleware } = createHarness({
      env: {
        enableDevSession: 'true',
        host: '127.0.0.1',
        devSessionToken: 'dev-token',
        devSessionUserId: 'admin-dev',
        devSessionTtlMs: 60_000,
        devSessionPaths: ['/screen/entry'],
      },
    });

    const req = createReq({ headers, path: '/screen/entry' });
    const next = jest.fn();

    middleware(req, createRes(), next);

    expect(req.session.session_token).toBe(expected);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('x-session-token はセッションへ反映せず監査ログのみ記録する', () => {
    const { middleware } = createHarness({
      env: {
        enableDevSession: 'true',
        host: '127.0.0.1',
        devSessionToken: 'dev-token',
        devSessionUserId: 'admin-dev',
        devSessionTtlMs: 60_000,
        devSessionPaths: ['/screen/entry'],
      },
    });

    const req = createReq({
      headers: {
        'x-session-token': 'legacy-token',
        'user-agent': 'jest-agent/1.0',
      },
      path: '/screen/entry',
      ip: '10.0.0.1',
    });

    middleware(req, createRes(), jest.fn());

    expect(req.session.session_token).toBe('dev-token');
    expect(req.app.locals.dependencies.logger.warn).toHaveBeenCalledWith(
      'auth.legacy_session_token_header.detected',
      {
        count: 1,
        source_ip: '10.0.0.1',
        user_agent: 'jest-agent/1.0',
      },
    );
  });

  test('Cookie 解析: Cookieヘッダの不正要素は無視し、session_token が無い場合は開発用固定セッションへフォールバックする', () => {
    const { middleware } = createHarness({
      env: {
        enableDevSession: 'true',
        host: '127.0.0.1',
        devSessionToken: 'dev-token',
        devSessionUserId: 'admin-dev',
        devSessionTtlMs: 60_000,
        devSessionPaths: ['/screen/entry'],
      },
    });

    const req = createReq({
      headers: {
        cookie: 'broken; =ignored; session_token; foo=bar',
      },
      path: '/screen/entry',
    });

    middleware(req, createRes(), jest.fn());

    expect(req.session.session_token).toBe('dev-token');
  });

  test('req.session ヘルパーの扱い: req.session.regenerate/destroy の最小契約を満たす', () => {
    const { middleware } = createHarness();
    const req = createReq();

    middleware(req, createRes(), jest.fn());
    req.session.custom = 'kept';

    const regenerateCallback = jest.fn();
    req.session.regenerate(regenerateCallback);

    expect(regenerateCallback).toHaveBeenCalledWith(null);
    expect(req.session.custom).toBeUndefined();
    expect(req.session.req).toBe(req);
    expect(typeof req.session.regenerate).toBe('function');
    expect(typeof req.session.destroy).toBe('function');

    req.session.custom = 'again';
    const destroyCallback = jest.fn();
    req.session.destroy(destroyCallback);

    expect(destroyCallback).toHaveBeenCalledWith(null);
    expect(req.session.custom).toBeUndefined();
    expect(req.session.req).toBe(req);
    expect(typeof req.session.regenerate).toBe('function');
    expect(typeof req.session.destroy).toBe('function');
  });

  test('開発セッション監査ログに host と判定理由を記録する', () => {
    const { middleware } = createHarness({
      env: {
        enableDevSession: 'true',
        host: '127.0.0.1',
        devSessionToken: 'dev-token',
        devSessionUserId: 'admin-dev',
        devSessionTtlMs: 60_000,
        devSessionPaths: ['/screen/entry'],
      },
    });
    const req = createReq({
      headers: {
        host: '127.0.0.1:3000',
      },
      path: '/screen/entry',
    });

    middleware(req, createRes(), jest.fn());

    expect(req.app.locals.dependencies.logger.info).toHaveBeenCalledWith(
      'auth.development_session.audit.before_apply',
      expect.objectContaining({
        reason: 'enabled',
        host: '127.0.0.1:3000',
        bind_host: '127.0.0.1',
      }),
    );
    expect(req.app.locals.dependencies.logger.info).toHaveBeenCalledWith(
      'auth.development_session.audit.after_apply',
      expect.objectContaining({
        reason: 'enabled',
        host: '127.0.0.1:3000',
        bind_host: '127.0.0.1',
      }),
    );
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
    const { middleware } = createHarness({
      env: {
        devSessionToken: 'dev-token',
        devSessionPaths: ['/screen/entry'],
      },
    });
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

  test('Strict-Transport-Security は本番環境のみ設定する', () => {
    const productionHarness = createHarness({ env: { nodeEnv: 'production' } });
    const developmentHarness = createHarness({ env: { nodeEnv: 'development' } });
    const productionRes = createRes();
    const developmentRes = createRes();

    productionHarness.middleware(createReq({ path: '/screen/login' }), productionRes, jest.fn());
    developmentHarness.middleware(createReq({ path: '/screen/login' }), developmentRes, jest.fn());

    expect(productionRes.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    expect(developmentRes.setHeader).not.toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.anything(),
    );
  });

  test('/contents 配信では静的配信専用ヘッダーを付与し、許可拡張子のみ配信する', () => {
    const app = {
      locals: {},
      set: jest.fn(),
      use: jest.fn(),
    };

    setupMiddleware(app, {
      env: {
        contentRootDirectory: '/tmp/contents',
      },
      dependencies: {},
    });

    const contentsUseCall = app.use.mock.calls.find(call => call[0] === '/contents');
    expect(contentsUseCall).toBeDefined();
    expect(contentsUseCall).toHaveLength(3);

    const [, validateContentStaticPath, staticMiddleware] = contentsUseCall;
    expect(typeof validateContentStaticPath).toBe('function');
    expect(typeof staticMiddleware).toBe('function');

    const next = jest.fn();
    const invalidRes = { status: jest.fn().mockReturnThis(), end: jest.fn() };
    validateContentStaticPath({ path: '/payload.html' }, invalidRes, next);
    expect(invalidRes.status).toHaveBeenCalledWith(404);
    expect(invalidRes.end).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();

    const validNext = jest.fn();
    validateContentStaticPath({ path: '/movie.webm' }, { status: jest.fn(), end: jest.fn() }, validNext);
    expect(validNext).toHaveBeenCalledTimes(1);
  });
});
