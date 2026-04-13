const express = require('express');
const path = require('path');
const { extractSessionTokenFromCookie } = require('../../../../helpers/extractSessionTokenFromCookie');

const setRouterScreenViewerGet = require('../../../../../src/controller/router/screen/setRouterScreenViewerGet');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const {
  FoundResult,
  MediaNotFoundResult,
  ContentNotFoundResult,
} = require('../../../../../src/application/media/query/GetMediaContentWithNavigationService');

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

describe('setRouterScreenViewerGet (middle)', () => {
  const createApp = ({ serviceResult }) => {
    const app = express();
    const router = express.Router();

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');
    app.engine('ejs', (filePath, options, callback) => {
      callback(
        null,
        `<!DOCTYPE html><html lang="ja"><head><title>${options.pageTitle}</title></head><body>${filePath}:${options.mediaId}:${options.mediaPage}:${options.content.id}:${options.previousPage ? options.previousPage.href : 'prev-none'}:${options.nextPage ? options.nextPage.href : 'next-none'}</body></html>`
      );
    });

    app.use((req, _res, next) => {
      req.session = {
        session_token: extractSessionTokenFromCookie(req.header('cookie')),
      };
      req.context = {};
      next();
    });

    setRouterScreenViewerGet({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([
          ['valid-token', 'user-001'],
        ]),
      }),
      getMediaContentWithNavigationService: {
        execute: jest.fn().mockResolvedValue(serviceResult),
      },
    });

    app.use(router);
    return app;
  };

  test('GET /screen/viewer/:mediaId/:mediaPage で viewer HTML を返す', async () => {
    const app = createApp({
      serviceResult: new FoundResult({
        contentId: '/contents/page-2.jpg',
        previousContentId: '/contents/page-1.jpg',
        nextContentId: '/contents/page-3.jpg',
      }),
    });

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/screen/viewer/media-001/2',
      headers: { cookie: 'session_token=valid-token' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.bodyText).toContain('<!DOCTYPE html>');
    expect(response.bodyText).toContain('<title>ビューアー media-001 - 2ページ</title>');
    expect(response.bodyText).toContain(path.join('src', 'views', 'screen', 'viewer.ejs'));
    expect(response.bodyText).toContain('media-001:2:/contents/page-2.jpg:/screen/viewer/media-001/1:/screen/viewer/media-001/3');
  });

  test('contentId がID形式の場合は public パスに変換して描画する', async () => {
    const app = createApp({
      serviceResult: new FoundResult({
        contentId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        previousContentId: null,
        nextContentId: null,
      }),
    });

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/screen/viewer/media-001/1',
      headers: { cookie: 'session_token=valid-token' },
    });

    expect(response.status).toBe(200);
    expect(response.bodyText).toContain('media-001:1:/contents/aa/aa/aa/aa/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:prev-none:next-none');
  });

  test('先頭ページでは前ページ導線なしで HTML を返す', async () => {
    const app = createApp({
      serviceResult: new FoundResult({
        contentId: '/contents/page-1.jpg',
        previousContentId: null,
        nextContentId: '/contents/page-2.jpg',
      }),
    });

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/screen/viewer/media-001/1',
      headers: { cookie: 'session_token=valid-token' },
    });

    expect(response.status).toBe(200);
    expect(response.bodyText).toContain(':prev-none:/screen/viewer/media-001/2');
  });

  test.each([
    ['未存在メディア', new MediaNotFoundResult()],
    ['未存在ページ', new ContentNotFoundResult()],
  ])('%s の場合はエラー画面へ 301 リダイレクトする', async (_name, serviceResult) => {
    const app = createApp({ serviceResult });

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/screen/viewer/media-404/99',
      headers: { cookie: 'session_token=valid-token' },
    });

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/screen/error');
  });
});
