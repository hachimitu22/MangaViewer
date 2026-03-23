const express = require('express');
const path = require('path');
const { Sequelize } = require('sequelize');

const setRouterScreenSummaryGet = require('../../../../../src/controller/router/screen/setRouterScreenSummaryGet');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const SequelizeMediaRepository = require('../../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeMediaQueryRepository = require('../../../../../src/infrastructure/SequelizeMediaQueryRepository');
const SequelizeUnitOfWork = require('../../../../../src/infrastructure/SequelizeUnitOfWork');
const { SearchMediaService } = require('../../../../../src/application/media/query/SearchMediaService');
const Media = require('../../../../../src/domain/media/media');
const MediaId = require('../../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../../src/domain/media/contentId');
const Tag = require('../../../../../src/domain/media/tag');
const Category = require('../../../../../src/domain/media/category');
const Label = require('../../../../../src/domain/media/label');

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

const createMedia = ({ mediaId, title, author }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  [new ContentId(`${mediaId}-content-001`)],
  [new Tag(new Category('作者'), new Label(author))],
  [new Category('作者')],
);

describe('setRouterScreenSummaryGet (middle)', () => {
  let sequelize;
  let unitOfWork;
  let mediaRepository;
  let mediaQueryRepository;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    mediaQueryRepository = new SequelizeMediaQueryRepository({ sequelize });
    await mediaRepository.sync();

    await unitOfWork.run(async () => {
      await mediaRepository.save(createMedia({ mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', title: '太郎の冒険', author: '山田' }));
      await mediaRepository.save(createMedia({ mediaId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', title: '花子の冒険', author: '佐藤' }));
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  const createApp = () => {
    const app = express();
    const router = express.Router();

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');
    app.engine('ejs', (filePath, options, callback) => {
      callback(null, `<!DOCTYPE html><html lang="ja"><head><title>${options.pageTitle}</title></head><body>${filePath}:${options.currentConditions.title}:${options.currentConditions.tags.map(tag => `${tag.category}:${tag.label}`).join(',')}:${options.mediaOverviews.map(media => media.title).join(',')}:${options.pagination.currentPage}</body></html>`);
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
      searchMediaService: new SearchMediaService({ mediaQueryRepository }),
    });

    app.use(router);
    return app;
  };

  test('GET /screen/summary で検索条件を正規化して一覧を描画する', async () => {
    const response = await requestApp({
      app: createApp(),
      targetPath: '/screen/summary?summaryPage=2&title=%E5%A4%AA%E9%83%8E&tags=%E4%BD%9C%E8%80%85%3A%E5%B1%B1%E7%94%B0&tags=%E4%B8%8D%E6%AD%A3&sort=title_desc',
      headers: { 'x-session-token': 'valid-token' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.bodyText).toContain('<title>メディア一覧</title>');
    expect(response.bodyText).toContain(path.join('src', 'views', 'screen', 'summary.ejs'));
    expect(response.bodyText).toContain(':太郎:作者:山田:');
    expect(response.bodyText).toContain('太郎の冒険');
    expect(response.bodyText).toContain(':1</body>');
  });
});
