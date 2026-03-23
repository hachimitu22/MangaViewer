const express = require('express');
const path = require('path');

const setRouterScreenSummaryGet = require('../../../../../src/controller/router/screen/setRouterScreenSummaryGet');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');

class InMemorySessionStateStore {
  constructor(entries = []) {
    this.tokenToUserId = new Map(entries);
  }

  findUserIdBySessionToken(sessionToken) {
    return this.tokenToUserId.get(sessionToken) ?? null;
  }
}

const requestApp = async ({ app, targetPath, headers = {} }) => {
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const response = await fetch(`http://127.0.0.1:${server.address().port}${targetPath}`, { headers });
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

describe('setRouterScreenSummaryGet (middle)', () => {
  const createApp = ({ searchMediaService } = {}) => {
    const app = express();
    const router = express.Router();
    const service = searchMediaService ?? {
      execute: jest.fn().mockResolvedValue({
        mediaOverviews: [{
          mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          title: '太郎の冒険',
          thumbnail: 'content-001',
          tags: [{ category: '作者', label: '山田' }],
          priorityCategories: ['作者'],
        }],
        totalCount: 1,
      }),
    };

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');
    app.engine('ejs', (filePath, options, callback) => {
      callback(null, `<!DOCTYPE html><html lang="ja"><head><title>${options.pageTitle}</title></head><body>${filePath}:${options.currentConditions.title}:${options.currentConditions.tags.map(tag => `${tag.category}:${tag.label}`).join(',')}:${options.currentConditions.start}:${options.currentConditions.size}:${options.mediaOverviews.map(media => media.title).join(',')}:${options.pagination.currentPage}</body></html>`);
    });

    app.use((req, _res, next) => {
      req.session = { session_token: req.header('x-session-token') };
      req.context = {};
      next();
    });

    setRouterScreenSummaryGet({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([['valid-token', 'user001']]),
      }),
      searchMediaService: service,
    });

    app.use(router);
    return { app, searchMediaService: service };
  };

  test('GET /screen/summary で検索条件を正規化して一覧を描画する', async () => {
    const { app, searchMediaService } = createApp();
    const response = await requestApp({
      app,
      targetPath: '/screen/summary?summaryPage=1&start=11&size=5&title=%E5%A4%AA%E9%83%8E&tags=%E4%BD%9C%E8%80%85%3A%E5%B1%B1%E7%94%B0&tags=%E4%B8%8D%E6%AD%A3&sort=title_desc',
      headers: { 'x-session-token': 'valid-token' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.bodyText).toContain('<title>メディア一覧</title>');
    expect(response.bodyText).toContain(path.join('src', 'views', 'screen', 'summary.ejs'));
    expect(response.bodyText).toContain(':太郎:作者:山田:11:5:');
    expect(response.bodyText).toContain('太郎の冒険');
    expect(response.bodyText).toContain(':1</body>');
    expect(searchMediaService.execute).toHaveBeenCalledWith(expect.objectContaining({
      title: '太郎',
      tags: [{ category: '作者', label: '山田' }],
      start: 11,
      size: 5,
    }));
  });
});
