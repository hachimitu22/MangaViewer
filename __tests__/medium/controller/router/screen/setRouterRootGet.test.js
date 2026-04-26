const express = require('express');
const { extractSessionTokenFromCookie } = require('../../../../helpers/extractSessionTokenFromCookie');

const setRouterRootGet = require('../../../../../src/controller/router/screen/setRouterRootGet');
const requestApp = async ({ app, method, targetPath, headers = {} } = {}) => {
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${targetPath}`, {
      method,
      headers,
      redirect: 'manual',
    });

    return {
      status: response.status,
      headers: response.headers,
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
};

describe('setRouterRootGet (middle)', () => {
  const createApp = () => {
    const app = express();
    const router = express.Router();

    app.use((req, _res, next) => {
      req.session = {
        session_token: extractSessionTokenFromCookie(req.header('cookie')),
      };
      next();
    });

    setRouterRootGet({
      router,
    });

    app.use(router);
    return app;
  };

  test('GET / は /screen/summary へリダイレクトする', async () => {
    const app = createApp();

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/',
    });

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get('location')).toBe('/screen/summary');
  });

  test('認証済みアクセス GET / は /screen/summary へリダイレクトする', async () => {
    const app = createApp();

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/',
      headers: {
        cookie: 'session_token=valid-token',
      },
    });

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get('location')).toBe('/screen/summary');
  });
});
