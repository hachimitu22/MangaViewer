const express = require('express');
const path = require('path');

const setRouterScreenSummaryGet = require('../../../../../src/controller/router/screen/setRouterScreenSummaryGet');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const { Output } = require('../../../../../src/application/media/query/SearchMediaService');

class InMemorySessionStateStore {
  constructor(entries = []) {
    this.tokenToUserId = new Map(entries);
  }

  findUserIdBySessionToken(sessionToken) {
    return this.tokenToUserId.get(sessionToken) ?? null;
  }
}

describe('setRouterScreenSummaryGet', () => {
  const createApp = ({ output } = {}) => {
    const app = express();
    const router = express.Router();
    const searchMediaService = {
      execute: jest.fn().mockResolvedValue(output ?? new Output({ mediaOverviews: [], totalCount: 0 })),
    };

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');
    app.use((req, _res, next) => {
      req.session = { session_token: req.header('x-session-token') };
      req.context = {};
      next();
    });

    setRouterScreenSummaryGet({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([['valid-token', 'user-001']]),
      }),
      searchMediaService,
    });

    app.use(router);
    return { app, searchMediaService };
  };

  test('GET /screen/summary で検索結果HTMLを返す', async () => {
    const { app, searchMediaService } = createApp({
      output: new Output({
        mediaOverviews: [{
          mediaId: 'media-001',
          title: 'タイトル1',
          thumbnail: '/contents/1.jpg',
          tags: [{ category: '作者', label: '山田' }],
          priorityCategories: ['作者'],
        }],
        totalCount: 1,
      }),
    });

    const server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/screen/summary?summaryPage=2&title=太郎&tags=%E4%BD%9C%E8%80%85%3A%E5%B1%B1%E7%94%B0&sort=title_desc`, {
      headers: { 'x-session-token': 'valid-token' },
    });
    const bodyText = await response.text();
    await new Promise(resolve => server.close(resolve));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(bodyText).toContain('<title>メディア一覧</title>');
    expect(bodyText).toContain('タイトル1');
    expect(bodyText).toContain('/screen/detail/media-001');
    expect(searchMediaService.execute).toHaveBeenCalledWith(expect.objectContaining({
      title: '太郎',
      tags: [{ category: '作者', label: '山田' }],
      start: 21,
    }));
  });
});
