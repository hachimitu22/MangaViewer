const express = require('express');
const path = require('path');
const { extractSessionTokenFromCookie } = require('../../../../helpers/extractSessionTokenFromCookie');

const setRouterScreenEditGet = require('../../../../../src/controller/router/screen/setRouterScreenEditGet');
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

describe('setRouterScreenEditGet (middle)', () => {
  const createApp = () => {
    const app = express();
    const router = express.Router();

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');
    app.engine('ejs', (filePath, options, callback) => {
      callback(
        null,
        `<!DOCTYPE html><html lang="ja"><head><title>${options.pageTitle}</title></head><body>${filePath}:${options.mediaDetail.id}:${options.mediaDetail.contents[0].url}</body></html>`
      );
    });

    app.use((req, _res, next) => {
      req.session = {
        session_token: extractSessionTokenFromCookie(req.header('cookie')),
      };
      req.context = {};
      next();
    });

    setRouterScreenEditGet({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([
          ['valid-token', 'user-001'],
        ]),
      }),
      getMediaDetailService: {
        execute: jest.fn().mockResolvedValue({
          mediaDetail: {
            id: 'media-001',
            title: 'メディア編集',
            contents: [{ id: '/contents/content-1' }],
            tags: [{ category: '作者', label: '山田' }],
            priorityCategories: ['作者'],
          },
        }),
      },
    });

    app.use(router);
    return app;
  };

  test('GET /screen/edit/:mediaId で HTML を返す', async () => {
    const app = createApp();

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/screen/edit/media-001',
      headers: {
        cookie: 'session_token=valid-token',
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.bodyText).toContain('<!DOCTYPE html>');
    expect(response.bodyText).toContain('<title>メディア編集 の編集</title>');
    expect(response.bodyText).toContain(path.join('src', 'views', 'screen', 'edit.ejs'));
    expect(response.bodyText).toContain('media-001');
    expect(response.bodyText).toContain('/contents/content-1');
  });
});
