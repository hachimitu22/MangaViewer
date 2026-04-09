const express = require('express');
const request = require('supertest');

const setRouterApiLogin = require('../../../../../src/controller/router/user/setRouterApiLogin');
const setRouterApiLogout = require('../../../../../src/controller/router/user/setRouterApiLogout');
const SessionAuthMiddleware = require('../../../../../src/controller/middleware/SessionAuthMiddleware');
const SessionStateRegistrar = require('../../../../../src/infrastructure/SessionStateRegistrar');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const InMemorySessionStateStore = require('../../../../../src/infrastructure/InMemorySessionStateStore');
const InMemoryLoginAttemptStore = require('../../../../../src/infrastructure/InMemoryLoginAttemptStore');
const SessionTerminator = require('../../../../../src/infrastructure/SessionTerminator');
const StaticLoginAuthenticator = require('../../../../../src/infrastructure/StaticLoginAuthenticator');
const { LoginService } = require('../../../../../src/application/user/command/LoginService');
const { LogoutService } = require('../../../../../src/application/user/command/LogoutService');
const setupMiddleware = require('../../../../../src/app/setupMiddleware');

const extractCsrfToken = cookies => {
  const cookie = (cookies || []).find(entry => entry.startsWith('csrf_token='));
  if (!cookie) {
    return '';
  }
  return cookie.split(';')[0].split('=')[1] || '';
};

describe('setRouterApiLogout (middle)', () => {
  const createCsrfReadyAgent = async app => {
    const agent = request.agent(app);
    const bootstrapResponse = await agent
      .get('/screen/login')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1');
    return {
      agent,
      csrfToken: extractCsrfToken(bootstrapResponse.headers['set-cookie']),
    };
  };

  const createApp = ({ sessionTerminator } = {}) => {
    const app = express();
    const router = express.Router();
    const sessionStateStore = new InMemorySessionStateStore();
    const loginAttemptStore = new InMemoryLoginAttemptStore();
    const authResolver = new SessionStateAuthAdapter({ sessionStateStore });
    const auth = new SessionAuthMiddleware(authResolver);

    setupMiddleware(app, {
      env: {},
      dependencies: {},
    });

    setRouterApiLogin({
      router,
      loginService: new LoginService({
        loginAuthenticator: new StaticLoginAuthenticator({
          username: 'admin',
          password: 'secret',
          userId: 'user-001',
        }),
        sessionStateRegistrar: new SessionStateRegistrar({ sessionStateStore }),
        sessionTtlMs: 60_000,
      }),
      loginAttemptStore,
    });

    setRouterApiLogout({
      router,
      authResolver,
      logoutService: new LogoutService({
        sessionTerminator: sessionTerminator || new SessionTerminator({ sessionStateStore }),
      }),
    });

    router.get('/api/protected', auth.execute.bind(auth), (req, res) => {
      res.status(200).json({ userId: req.context.userId });
    });

    app.use(router);
    return app;
  };

  test('認証済みなら POST /api/logout でcode=0を返し、後続リクエストは401になる', async () => {
    const app = createApp();
    const { agent, csrfToken } = await createCsrfReadyAgent(app);

    const loginResponse = await agent
      .post('/api/login')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', csrfToken)
      .type('form')
      .send({ username: 'admin', password: 'secret' });

    const logoutResponse = await request(app)
      .post('/api/logout')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', extractCsrfToken(loginResponse.headers['set-cookie']))
      .set('Cookie', loginResponse.headers['set-cookie']);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body).toEqual({ code: 0 });
    expect(logoutResponse.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringMatching(/session_token=;/),
      expect.stringMatching(/Path=\//),
      expect.stringMatching(/SameSite=Lax/),
    ]));

    const protectedResponse = await request(app)
      .get('/api/protected')
      .set('Cookie', loginResponse.headers['set-cookie']);

    expect(protectedResponse.status).toBe(401);
    expect(protectedResponse.body).toEqual({ message: '認証に失敗しました' });
  });

  test('未認証で POST /api/logout を呼ぶと既存仕様どおり401 JSONを返す', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/logout');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: '認証に失敗しました' });
  });

  test('セッション破棄失敗時は POST /api/logout がcode=1を返す', async () => {
    const sessionTerminator = {
      execute: jest.fn().mockResolvedValue(false),
    };
    const app = createApp({ sessionTerminator });
    const { agent, csrfToken } = await createCsrfReadyAgent(app);

    const loginResponse = await agent
      .post('/api/login')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', csrfToken)
      .type('form')
      .send({ username: 'admin', password: 'secret' });

    const logoutResponse = await request(app)
      .post('/api/logout')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', extractCsrfToken(loginResponse.headers['set-cookie']))
      .set('Cookie', loginResponse.headers['set-cookie']);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body).toEqual({ code: 1 });
    expect(logoutResponse.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringMatching(/session_token=;/),
      expect.stringMatching(/Path=\//),
      expect.stringMatching(/SameSite=Lax/),
    ]));
  });
});
