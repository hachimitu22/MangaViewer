const express = require('express');
const path = require('path');
const { extractSessionTokenFromCookie } = require('../../../../helpers/extractSessionTokenFromCookie');

const setRouterScreenQueueGet = require('../../../../../src/controller/router/screen/setRouterScreenQueueGet');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const { Output } = require('../../../../../src/application/user/query/GetQueueService');

class InMemorySessionStateStore {
  constructor(entries = []) {
    this.tokenToUserId = new Map(entries);
  }
  findUserIdBySessionToken(sessionToken) {
    return this.tokenToUserId.get(sessionToken) ?? null;
  }
}

describe('setRouterScreenQueueGet', () => {
  test('GET /screen/queue でクエリ条件つきあとで見る一覧HTMLを返す', async () => {
    const app = express();
    const router = express.Router();
    const getQueueService = {
      execute: jest.fn().mockResolvedValue(new Output({
        sort: 'title_asc',
        queuePage: 2,
        start: 21,
        totalCount: 25,
        mediaOverviews: [{
          mediaId: 'media-001',
          title: 'タイトル1',
          thumbnail: '/contents/1.jpg',
          tags: [{ category: '作者', label: '山田' }],
          priorityCategories: ['作者'],
        }],
        currentPageMediaOverviews: [{
          mediaId: 'media-001',
          title: 'タイトル1',
          thumbnail: '/contents/1.jpg',
          tags: [{ category: '作者', label: '山田' }],
          priorityCategories: ['作者'],
          isFavorite: true,
          isQueued: true,
        }],
      })),
    };

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');
    app.use((req, _res, next) => {
      req.session = { session_token: extractSessionTokenFromCookie(req.header('cookie')) };
      req.context = {};
      next();
    });

    setRouterScreenQueueGet({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([['valid-token', 'user-001']]),
      }),
      getQueueService,
    });
    app.use(router);

    const server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/screen/queue?sort=title_asc&queuePage=2`, {
      headers: { cookie: 'session_token=valid-token' },
    });
    const bodyText = await response.text();
    await new Promise(resolve => server.close(resolve));

    expect(response.status).toBe(200);
    expect(bodyText).toContain('<title>あとで見る一覧</title>');
    expect(bodyText).toContain('タイトル1');
    expect(bodyText).toContain('/screen/detail/media-001');
    expect(bodyText).toContain('/screen/summary?summaryPage=1&sort=date_asc&tags=');
    expect(bodyText).toContain('お気に入り解除');
    expect(bodyText).toContain('あとで見る解除');
    expect(bodyText).toContain('/screen/queue?queuePage=1&amp;sort=title_asc');
    expect(bodyText).toContain('追加日時の新しい順');
    expect(bodyText).toContain('追加日時の古い順');
    expect(getQueueService.execute).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-001',
      sort: 'title_asc',
      queuePage: 2,
      start: 21,
    }));
  });
});
