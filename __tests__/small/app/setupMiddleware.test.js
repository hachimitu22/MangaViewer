const setupMiddleware = require('../../../src/app/setupMiddleware');

const createReq = ({
  headers = {},
  path = '/screen/entry',
} = {}) => ({
  path,
  header: name => headers[name.toLowerCase()],
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
      title: 'x-session-token が存在する場合は最優先で採用する',
      headers: {
        'x-session-token': 'header-token',
        cookie: 'session_token=cookie-token',
      },
      expected: 'header-token',
    },
    {
      title: 'x-session-token が無い場合は session_token Cookie を採用する',
      headers: {
        cookie: 'theme=dark; session_token=cookie-token',
      },
      expected: 'cookie-token',
    },
    {
      title: 'x-session-token と session_token Cookie が無い場合は開発用固定セッションを採用する',
      headers: {},
      expected: 'dev-token',
    },
  ])('セッショントークン解決優先順位: $title', ({ headers, expected }) => {
    const { middleware } = createHarness({
      env: {
        devSessionToken: 'dev-token',
        devSessionUserId: 'admin-dev',
        devSessionTtlMs: 60_000,
        devSessionPaths: ['/screen/entry'],
      },
    });

    const req = createReq({ headers, path: '/screen/entry' });
    const next = jest.fn();

    middleware(req, {}, next);

    expect(req.session.session_token).toBe(expected);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('Cookie 解析: Cookieヘッダの不正要素は無視し、session_token が無い場合は開発用固定セッションへフォールバックする', () => {
    const { middleware } = createHarness({
      env: {
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

    middleware(req, {}, jest.fn());

    expect(req.session.session_token).toBe('dev-token');
  });

  test('req.session ヘルパーの扱い: req.session.regenerate/destroy の最小契約を満たす', () => {
    const { middleware } = createHarness();
    const req = createReq();

    middleware(req, {}, jest.fn());
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
});
