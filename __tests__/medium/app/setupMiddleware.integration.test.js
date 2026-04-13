const express = require('express');
const request = require('supertest');

const setupMiddleware = require('../../../src/app/setupMiddleware');
const SessionAuthMiddleware = require('../../../src/controller/middleware/SessionAuthMiddleware');

const createApp = () => {
  const app = express();
  const authAdapter = {
    execute: jest.fn(async token => {
      if (token === 'cookie-token' || token === 'dev-token') {
        return `user:${token}`;
      }
      return null;
    }),
  };
  const sessionAuthMiddleware = new SessionAuthMiddleware(authAdapter);

  setupMiddleware(app, {
    env: {
      enableDevSession: 'true',
      devSessionToken: 'dev-token',
      devSessionUserId: 'admin-dev',
      devSessionTtlMs: 60_000,
      devSessionPaths: ['/protected'],
    },
    dependencies: {},
  });

  app.get('/protected',
    (req, res, next) => sessionAuthMiddleware.execute(req, res, next),
    (req, res) => {
      res.status(200).json({
        sessionToken: req.session.session_token,
        userId: req.context.userId,
      });
    });

  return { app, authAdapter };
};

describe('setupMiddleware と SessionAuthMiddleware の接続 (medium)', () => {
  test.each([
    {
      title: 'session_token Cookie を採用する',
      headers: {
        cookie: 'session_token=cookie-token',
      },
      expected: 'cookie-token',
    },
    {
      title: 'Cookie が無い場合は DevelopmentSession を採用する',
      headers: {},
      expected: 'dev-token',
    },
  ])('セッショントークン解決優先順位: $title', async ({ headers, expected }) => {
    const { app, authAdapter } = createApp();
    let req = request(app).get('/protected');

    Object.entries(headers).forEach(([key, value]) => {
      req = req.set(key, value);
    });

    const response = await req;

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sessionToken: expected,
      userId: `user:${expected}`,
    });
    expect(authAdapter.execute).toHaveBeenCalledWith(expected);
  });

  test('後続ミドルウェアへの契約: setupMiddleware が解決した req.session.session_token を SessionAuthMiddleware が利用できる', async () => {
    const { app } = createApp();

    const response = await request(app)
      .get('/protected')
      .set('cookie', 'invalid; session_token=cookie-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sessionToken: 'cookie-token',
      userId: 'user:cookie-token',
    });
  });
});
