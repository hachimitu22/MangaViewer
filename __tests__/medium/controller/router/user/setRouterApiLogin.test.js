const express = require('express');
const request = require('supertest');

const setRouterApiLogin = require('../../../../../src/controller/router/user/setRouterApiLogin');
const SessionAuthMiddleware = require('../../../../../src/controller/middleware/SessionAuthMiddleware');
const SessionStateRegistrar = require('../../../../../src/infrastructure/SessionStateRegistrar');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const InMemorySessionStateStore = require('../../../../../src/infrastructure/InMemorySessionStateStore');
const StaticLoginAuthenticator = require('../../../../../src/infrastructure/StaticLoginAuthenticator');
const { LoginService } = require('../../../../../src/application/user/command/LoginService');
const setupMiddleware = require('../../../../../src/app/setupMiddleware');

describe('setRouterApiLogin (middle)', () => {
  const createApp = () => {
    const app = express();
    const router = express.Router();
    const sessionStateStore = new InMemorySessionStateStore();
    const authResolver = new SessionStateAuthAdapter({ sessionStateStore });
    const auth = new SessionAuthMiddleware(authResolver);

    setupMiddleware(app, {
      env: {
        loginSessionTtlMs: 60_000,
      },
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

    router.get('/api/protected', auth.execute.bind(auth), (req, res) => {
      res.status(200).json({ userId: req.context.userId });
    });

    app.use(router);
    return app;
  };

  test('POST /api/login に成功すると Set-Cookie を返し、後続リクエストで認証できる', async () => {
    const app = createApp();

    const loginResponse = await request(app)
      .post('/api/login')
      .type('form')
      .send({ username: 'admin', password: 'secret' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toEqual({ code: 0 });
    expect(loginResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^session_token=[^;]+; Max-Age=60; Path=\/; Expires=[^;]+; HttpOnly; SameSite=Lax/)]),
    );

    const protectedResponse = await request(app)
      .get('/api/protected')
      .set('Cookie', loginResponse.headers['set-cookie']);

    expect(protectedResponse.status).toBe(200);
    expect(protectedResponse.body).toEqual({ userId: 'user-001' });
  });

  test('POST /api/login に失敗すると code=1 を返し、認証状態を確立しない', async () => {
    const app = createApp();

    const loginResponse = await request(app)
      .post('/api/login')
      .type('form')
      .send({ username: 'admin', password: 'wrong' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toEqual({ code: 1 });
    expect(loginResponse.headers['set-cookie']).toBeUndefined();

    const protectedResponse = await request(app)
      .get('/api/protected');

    expect(protectedResponse.status).toBe(401);
    expect(protectedResponse.body).toEqual({ message: '認証に失敗しました' });
  });
});
