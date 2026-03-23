const express = require('express');
const request = require('supertest');

const setRouterApiLogin = require('../../../../../src/controller/router/user/setRouterApiLogin');
const setRouterApiLogout = require('../../../../../src/controller/router/user/setRouterApiLogout');
const SessionAuthMiddleware = require('../../../../../src/controller/middleware/SessionAuthMiddleware');
const SessionStateRegistrar = require('../../../../../src/infrastructure/SessionStateRegistrar');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const InMemorySessionStateStore = require('../../../../../src/infrastructure/InMemorySessionStateStore');
const SessionTerminator = require('../../../../../src/infrastructure/SessionTerminator');
const StaticLoginAuthenticator = require('../../../../../src/infrastructure/StaticLoginAuthenticator');
const { LoginService } = require('../../../../../src/application/user/command/LoginService');
const { LogoutService } = require('../../../../../src/application/user/command/LogoutService');
const setupMiddleware = require('../../../../../src/app/setupMiddleware');

describe('setRouterApiLogout (middle)', () => {
  const createApp = ({ sessionTerminator } = {}) => {
    const app = express();
    const router = express.Router();
    const sessionStateStore = new InMemorySessionStateStore();
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

    const loginResponse = await request(app)
      .post('/api/login')
      .type('form')
      .send({ username: 'admin', password: 'secret' });

    const logoutResponse = await request(app)
      .post('/api/logout')
      .set('Cookie', loginResponse.headers['set-cookie']);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body).toEqual({ code: 0 });

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

    const loginResponse = await request(app)
      .post('/api/login')
      .type('form')
      .send({ username: 'admin', password: 'secret' });

    const logoutResponse = await request(app)
      .post('/api/logout')
      .set('Cookie', loginResponse.headers['set-cookie']);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body).toEqual({ code: 1 });
  });
});
