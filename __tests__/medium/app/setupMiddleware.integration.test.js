const express = require('express');
const request = require('supertest');

const setupMiddleware = require('../../../src/app/setupMiddleware');

const createApp = () => {
  const app = express();

  setupMiddleware(app, {
    env: {},
    dependencies: {},
  });

  app.get('/protected', (req, res) => {
    res.status(200).json({
      csrfToken: req.session.csrf_token,
      requestId: req.context.requestId,
    });
  });

  return { app };
};

describe('setupMiddleware の接続 (medium)', () => {
  test('csrf_token Cookie を採用する', async () => {
    const { app } = createApp();

    const response = await request(app)
      .get('/protected')
      .set('cookie', 'csrf_token=cookie-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      csrfToken: 'cookie-token',
    }));
  });

  test('csrf_token Cookie が無い場合は新規採番して cookie を返す', async () => {
    const { app } = createApp();

    const response = await request(app).get('/protected');

    expect(response.status).toBe(200);
    expect(typeof response.body.csrfToken).toBe('string');
    expect(response.body.csrfToken.length).toBeGreaterThan(0);
    expect(response.headers['set-cookie']?.some(value => value.startsWith('csrf_token='))).toBe(true);
  });

  test('x-request-id がある場合はレスポンスヘッダーと context に同値を反映する', async () => {
    const { app } = createApp();

    const response = await request(app)
      .get('/protected')
      .set('x-request-id', 'req-123');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('req-123');
    expect(response.body.requestId).toBe('req-123');
  });
});
