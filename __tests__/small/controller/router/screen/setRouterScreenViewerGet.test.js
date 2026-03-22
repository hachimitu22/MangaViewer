const express = require('express');
const path = require('path');

const setRouterScreenViewerGet = require('../../../../../src/controller/router/screen/setRouterScreenViewerGet');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const {
  FoundResult,
} = require('../../../../../src/application/media/query/GetMediaContentWithNavigationService');

class InMemorySessionStateStore {
  constructor(entries = []) {
    this.tokenToUserId = new Map(entries);
  }

  findUserIdBySessionToken(sessionToken) {
    return this.tokenToUserId.get(sessionToken) ?? null;
  }
}

describe('setRouterScreenViewerGet', () => {
  const createApp = ({ result } = {}) => {
    const app = express();
    const router = express.Router();
    const getMediaContentWithNavigationService = {
      execute: jest.fn().mockResolvedValue(result ?? new FoundResult({
        contentId: '0123456789abcdef0123456789abcdef',
        previousContentId: null,
        nextContentId: 'fedcba9876543210fedcba9876543210',
      })),
    };

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');
    app.use((req, _res, next) => {
      req.session = { session_token: req.header('x-session-token') };
      req.context = {};
      next();
    });

    setRouterScreenViewerGet({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([['valid-token', 'user-001']]),
      }),
      getMediaContentWithNavigationService,
    });

    app.use(router);
    return { app, getMediaContentWithNavigationService };
  };

  test('GET /screen/viewer/:mediaId/:mediaPage で viewer HTML を返す', async () => {
    const { app, getMediaContentWithNavigationService } = createApp();

    const server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/screen/viewer/media-001/2`, {
      headers: { 'x-session-token': 'valid-token' },
    });
    const bodyText = await response.text();
    await new Promise(resolve => server.close(resolve));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(bodyText).toContain('<title>ビューアー media-001 - 2ページ</title>');
    expect(bodyText).toContain('/screen/viewer/media-001/3');
    expect(bodyText).toContain('/screen/detail/media-001');
    expect(bodyText).toContain('/content/01/23/45/67/0123456789abcdef0123456789abcdef');
    expect(getMediaContentWithNavigationService.execute).toHaveBeenCalledWith(expect.objectContaining({
      mediaId: 'media-001',
      contentPosition: 2,
    }));
  });
});
