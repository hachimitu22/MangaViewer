const express = require('express');
const path = require('path');
const { Sequelize } = require('sequelize');

const setRouterScreenDetailGet = require('../../../../../src/controller/router/screen/setRouterScreenDetailGet');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const SequelizeMediaRepository = require('../../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeUnitOfWork = require('../../../../../src/infrastructure/SequelizeUnitOfWork');
const { GetMediaDetailService } = require('../../../../../src/application/media/query/GetMediaDetailService');
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

describe('setRouterScreenDetailGet (middle)', () => {
  let sequelize;
  let unitOfWork;
  let mediaRepository;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    await mediaRepository.sync();

    await unitOfWork.run(async () => {
      await mediaRepository.save(new Media(
        new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        new MediaTitle('作品A'),
        [new ContentId('content-001'), new ContentId('')],
        [new Tag(new Category('作者'), new Label('山田 太郎'))],
        [new Category('作者')],
      ));
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

    app.use((req, _res, next) => {
      req.session = { session_token: req.header('x-session-token') };
      req.context = {};
      next();
    });

    setRouterScreenDetailGet({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([['valid-token', 'user001']]),
      }),
      getMediaDetailService: new GetMediaDetailService({ mediaRepository }),
    });

    app.use(router);
    return app;
  };

  test('GET /screen/detail/:mediaId でカテゴリーを含む主要表示を描画する', async () => {
    const response = await requestApp({
      app: createApp(),
      targetPath: '/screen/detail/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      headers: { 'x-session-token': 'valid-token' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.bodyText).toContain('<title>作品A の詳細</title>');
    expect(response.bodyText).toContain('登録日:');
    expect(response.bodyText).toContain('カテゴリー一覧');
    expect(response.bodyText).toContain('/screen/summary?summaryPage=1&sort=date_asc&tags=%E4%BD%9C%E8%80%85%3A%E5%B1%B1%E7%94%B0%20%E5%A4%AA%E9%83%8E');
    expect(response.bodyText).toContain('/screen/viewer/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/1');
    expect(response.bodyText).toContain('src="content-001"');
    expect(response.bodyText).toContain('サムネイル未設定');
  });
});
