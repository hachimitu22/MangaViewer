const express = require('express');
const request = require('supertest');

const setRouterApiLogin = require('../../../../../src/controller/router/user/setRouterApiLogin');
const SessionAuthMiddleware = require('../../../../../src/controller/middleware/SessionAuthMiddleware');
const SessionStateRegistrar = require('../../../../../src/infrastructure/SessionStateRegistrar');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const InMemorySessionStateStore = require('../../../../../src/infrastructure/InMemorySessionStateStore');
const InMemoryLoginAttemptStore = require('../../../../../src/infrastructure/InMemoryLoginAttemptStore');
const StaticLoginAuthenticator = require('../../../../../src/infrastructure/StaticLoginAuthenticator');
const { LoginService } = require('../../../../../src/application/user/command/LoginService');
const setupMiddleware = require('../../../../../src/app/setupMiddleware');

describe('setRouterApiLogin (middle)', () => {
  const createApp = ({
    maxAttemptsPerWindow = 5,
    windowMs = 60_000,
  } = {}) => {
    const app = express();
    const router = express.Router();
    const sessionStateStore = new InMemorySessionStateStore();
    const loginAttemptStore = new InMemoryLoginAttemptStore();
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
      loginAttemptStore,
      maxAttemptsPerWindow,
      windowMs,
    });

    router.get('/api/protected', auth.execute.bind(auth), (req, res) => {
      res.status(200).json({ userId: req.context.userId });
    });

    app.use(router);
    return app;
  };

  test('閾値以内は通常通りログインできる', async () => {
    const app = createApp({ maxAttemptsPerWindow: 5 });

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

  test('閾値超過でRateLimiterにより拒否される', async () => {
    const app = createApp({ maxAttemptsPerWindow: 2, windowMs: 60_000 });

    const first = await request(app)
      .post('/api/login')
      .type('form')
      .send({ username: 'admin', password: 'wrong' });
    const second = await request(app)
      .post('/api/login')
      .type('form')
      .send({ username: 'admin', password: 'wrong' });
    const third = await request(app)
      .post('/api/login')
      .type('form')
      .send({ username: 'admin', password: 'wrong' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body).toEqual({ code: 1 });
  });

  test('ロック期間経過後は再試行可能', async () => {
    const app = createApp({ maxAttemptsPerWindow: 100, windowMs: 60_000 });

      for (let i = 0; i < 3; i += 1) {
        const response = await request(app)
          .post('/api/login')
          .type('form')
          .send({ username: 'admin', password: 'wrong' });
        expect(response.status).toBe(200);
      }

      const lockedResponse = await request(app)
        .post('/api/login')
        .type('form')
        .send({ username: 'admin', password: 'secret' });

      expect(lockedResponse.status).toBe(429);
      expect(lockedResponse.body).toEqual({ code: 1 });

    await new Promise(resolve => setTimeout(resolve, 1_100));

      const retryResponse = await request(app)
        .post('/api/login')
        .type('form')
        .send({ username: 'admin', password: 'secret' });

      expect(retryResponse.status).toBe(200);
      expect(retryResponse.body).toEqual({ code: 0 });
  });

  test('成功時に失敗カウンタがリセットされる', async () => {
    const app = createApp({ maxAttemptsPerWindow: 100, windowMs: 60_000 });

      for (let i = 0; i < 2; i += 1) {
        const response = await request(app)
          .post('/api/login')
          .type('form')
          .send({ username: 'admin', password: 'wrong' });
        expect(response.status).toBe(200);
      }

      const success = await request(app)
        .post('/api/login')
        .type('form')
        .send({ username: 'admin', password: 'secret' });

      expect(success.status).toBe(200);
      expect(success.body).toEqual({ code: 0 });

      for (let i = 0; i < 2; i += 1) {
        const response = await request(app)
          .post('/api/login')
          .type('form')
          .send({ username: 'admin', password: 'wrong' });
        expect(response.status).toBe(200);
      }

      const shouldNotLockYet = await request(app)
        .post('/api/login')
        .type('form')
        .send({ username: 'admin', password: 'secret' });

      expect(shouldNotLockYet.status).toBe(200);
      expect(shouldNotLockYet.body).toEqual({ code: 0 });
  });
});
