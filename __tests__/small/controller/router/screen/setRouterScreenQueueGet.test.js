const express = require('express');
const path = require('path');

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
  test('GET /screen/queue であとで見る一覧HTMLを返す', async () => {
    const app = express();
    const router = express.Router();
    const getQueueService = {
      execute: jest.fn().mockResolvedValue(new Output({
        mediaOverviews: [{
          mediaId: 'media-001',
          title: 'タイトル1',
          thumbnail: '/contents/1.jpg',
          tags: [{ category: '作者', label: '山田' }],
          priorityCategories: ['作者'],
        }],
      })),
    };

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');
    app.use((req, _res, next) => {
      req.session = { session_token: req.header('x-session-token') };
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
    const response = await fetch(`http://127.0.0.1:${port}/screen/queue`, {
      headers: { 'x-session-token': 'valid-token' },
    });
    const bodyText = await response.text();
    await new Promise(resolve => server.close(resolve));

    expect(response.status).toBe(200);
    expect(bodyText).toContain('<title>あとで見る一覧</title>');
    expect(bodyText).toContain('タイトル1');
    expect(bodyText).toContain('/screen/detail/media-001');
    expect(bodyText).toContain('/screen/summary?summaryPage=1&sort=date_asc&tags=');
    expect(getQueueService.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-001' }));
  });
});
