const express = require('express');
const path = require('path');

const setRouterScreenQueueGet = require('../../../../../src/controller/router/screen/setRouterScreenQueueGet');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');

class InMemorySessionStateStore {
  constructor(entries = []) {
    this.tokenToUserId = new Map(entries);
  }

  findUserIdBySessionToken(sessionToken) {
    return this.tokenToUserId.get(sessionToken) ?? null;
  }
}

const requestApp = async ({ app, method = 'GET', targetPath, headers = {} }) => {
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const response = await fetch(`http://127.0.0.1:${server.address().port}${targetPath}`, { method, headers });
    return {
      status: response.status,
      headers: response.headers,
      bodyText: await response.text(),
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
};

describe('setRouterScreenQueueGet (middle)', () => {
  const createApp = ({ getQueueService } = {}) => {
    const app = express();
    const router = express.Router();
    const service = getQueueService ?? {
      execute: jest.fn().mockResolvedValue({
        sort: 'title_desc',
        queuePage: 2,
        start: 21,
        totalCount: 41,
        mediaOverviews: [{
          mediaId: 'media-001',
          title: 'タイトル1',
          thumbnail: 'content-001',
          tags: [{ category: '作者', label: '山田' }],
          priorityCategories: [],
          isFavorite: false,
          isQueued: true,
        }],
      }),
    };

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');
    app.engine('ejs', (filePath, options, callback) => {
      callback(
        null,
        `<!DOCTYPE html><html lang="ja"><head><title>${options.pageTitle}</title></head><body>${filePath}:${options.currentConditions.sort}:${options.currentConditions.queuePage}:${options.totalCount}:${options.pagination.items.join(',')}:${options.mediaOverviews[0].thumbnail}:${options.mediaOverviews[0].isFavorite}:${options.mediaOverviews[0].isQueued}:summary=/screen/summary?summaryPage=1&sort=date_asc&tags=:page=/screen/queue?queuePage=1&sort=${options.currentConditions.sort}:favoriteLabel=${options.mediaOverviews[0].isFavorite ? 'お気に入り解除' : 'お気に入り追加'}:queueLabel=${options.mediaOverviews[0].isQueued ? 'あとで見る解除' : 'あとで見る追加'}:script=.js-favorite-toggle/.js-queue-toggle</body></html>`
      );
    });

    app.use((req, _res, next) => {
      req.session = {
        session_token: req.header('x-session-token'),
      };
      req.context = {};
      next();
    });

    setRouterScreenQueueGet({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([
          ['valid-token', 'user-001'],
        ]),
      }),
      getQueueService: service,
    });

    app.use(router);
    return { app, getQueueService: service };
  };

  test('GET /screen/queue で並び順変更・ページ切替・トグルUIに必要な描画情報を返す', async () => {
    const { app, getQueueService } = createApp();

    const response = await requestApp({
      app,
      targetPath: '/screen/queue?sort=title_desc&queuePage=2',
      headers: {
        'x-session-token': 'valid-token',
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.bodyText).toContain('<title>あとで見る一覧</title>');
    expect(response.bodyText).toContain(path.join('src', 'views', 'screen', 'queue.ejs'));
    expect(response.bodyText).toContain(':title_desc:2:41:1,2,3:/contents/content-001:false:true:');
    expect(response.bodyText).toContain('summary=/screen/summary?summaryPage=1&sort=date_asc&tags=');
    expect(response.bodyText).toContain('page=/screen/queue?queuePage=1&sort=title_desc');
    expect(response.bodyText).toContain('favoriteLabel=お気に入り追加');
    expect(response.bodyText).toContain('queueLabel=あとで見る解除');
    expect(response.bodyText).toContain('script=.js-favorite-toggle/.js-queue-toggle');
    expect(getQueueService.execute).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-001',
      sort: 'title_desc',
      queuePage: 2,
      start: 21,
    }));
  });
});
