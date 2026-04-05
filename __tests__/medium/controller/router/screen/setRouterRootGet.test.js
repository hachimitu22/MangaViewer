const express = require('express');

const setRouterRootGet = require('../../../../../src/controller/router/screen/setRouterRootGet');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');

class InMemorySessionStateStore {
  constructor(entries = []) {
    this.tokenToUserId = new Map(entries);
  }

  findUserIdBySessionToken(sessionToken) {
    return this.tokenToUserId.get(sessionToken) ?? null;
  }
}

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
        session_token: req.header('x-session-token'),
      };
      next();
    });

    setRouterRootGet({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([
          ['valid-token', 'user-001'],
        ]),
      }),
    });

    app.use(router);
    return app;
  };

  test('未認証アクセス GET / は /screen/login へリダイレクトする', async () => {
    const app = createApp();

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/',
    });

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get('location')).toBe('/screen/login');
  });

  test('認証済みアクセス GET / は /screen/summary へリダイレクトする', async () => {
    const app = createApp();

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/',
      headers: {
        'x-session-token': 'valid-token',
      },
    });

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get('location')).toBe('/screen/summary');
  });
});
