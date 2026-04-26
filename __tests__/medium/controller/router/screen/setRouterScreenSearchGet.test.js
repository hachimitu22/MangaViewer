const express = require('express');
const path = require('path');

const setRouterScreenSearchGet = require('../../../../../src/controller/router/screen/setRouterScreenSearchGet');
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
    });

    return {
      status: response.status,
      headers: response.headers,
      bodyText: await response.text(),
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

describe('setRouterScreenSearchGet (middle)', () => {
  const createApp = () => {
    const app = express();
    const router = express.Router();

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');
    app.engine('ejs', (filePath, options, callback) => {
      callback(
        null,
        `<!DOCTYPE html><html lang="ja"><head><title>${options.pageTitle}</title></head><body>${filePath}</body></html>`
      );
    });

    app.use((req, _res, next) => {
      req.session = {};
      req.context = {};
      next();
    });

    setRouterScreenSearchGet({
      router,
    });

    app.use(router);
    return app;
  };

  test('GET /screen/search で HTML を返す', async () => {
    const app = createApp();

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/screen/search',
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.bodyText).toContain('<!DOCTYPE html>');
    expect(response.bodyText).toContain('<title>メディア検索</title>');
    expect(response.bodyText).toContain(path.join('src', 'views', 'screen', 'search.ejs'));
  });
});
