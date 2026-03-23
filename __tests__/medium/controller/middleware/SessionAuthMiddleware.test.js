const express = require('express');
const request = require('supertest');

const SessionAuthMiddleware = require('../../../../src/controller/middleware/SessionAuthMiddleware');

const createApp = ({ authAdapter, withSession = true, presetContext } = {}) => {
  const app = express();
  const middleware = new SessionAuthMiddleware(authAdapter);

  app.use((req, _res, next) => {
    if (withSession) {
      req.session = { session_token: req.header('x-session-token') };
    }
    if (presetContext !== undefined) {
      req.context = presetContext;
    }
    next();
  });

  app.get('/protected', (req, res, next) => middleware.execute(req, res, next), (req, res) => {
    res.status(200).json({
      userId: req.context?.userId ?? null,
      contextKeys: Object.keys(req.context ?? {}),
    });
  });

  return app;
};

describe('SessionAuthMiddleware (middle)', () => {
  test('normal: request.context が未作成でも初期化して userId を設定し next へ委譲する', async () => {
    const app = createApp({
      authAdapter: {
        execute: jest.fn(async token => (token === 'valid-token' ? 'user001' : null)),
      },
    });

    const response = await request(app)
      .get('/protected')
      .set('x-session-token', 'valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      userId: 'user001',
      contextKeys: ['userId'],
    });
  });

  test('business: userId を解決できない場合は 401 と既定エラーボディを返す', async () => {
    const app = createApp({
      authAdapter: {
        execute: jest.fn(async () => null),
      },
      presetContext: { traceId: 'trace-001' },
    });

    const response = await request(app)
      .get('/protected')
      .set('x-session-token', 'valid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: '認証に失敗しました' });
  });

  test('technical: authAdapter が例外を送出しても 401 を返し後続へ委譲しない', async () => {
    const app = createApp({
      authAdapter: {
        execute: jest.fn(async () => {
          throw new Error('session store unavailable');
        }),
      },
    });

    const response = await request(app)
      .get('/protected')
      .set('x-session-token', 'valid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: '認証に失敗しました' });
  });
});
