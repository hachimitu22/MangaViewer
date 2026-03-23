const express = require('express');
const path = require('path');
const { Sequelize } = require('sequelize');

const setRouterScreenFavoriteGet = require('../../../../../src/controller/router/screen/setRouterScreenFavoriteGet');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const SequelizeMediaRepository = require('../../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeMediaQueryRepository = require('../../../../../src/infrastructure/SequelizeMediaQueryRepository');
const SequelizeUserRepository = require('../../../../../src/infrastructure/SequelizeUserRepository');
const SequelizeUnitOfWork = require('../../../../../src/infrastructure/SequelizeUnitOfWork');
const { GetFavoriteSummariesService } = require('../../../../../src/application/user/query/GetFavoriteSummariesService');
const User = require('../../../../../src/domain/user/user');
const UserId = require('../../../../../src/domain/user/userId');
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

describe('setRouterScreenFavoriteGet (middle)', () => {
  let sequelize;
  let unitOfWork;
  let mediaRepository;
  let userRepository;
  let mediaQueryRepository;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    userRepository = new SequelizeUserRepository({ sequelize, unitOfWorkContext: unitOfWork });
    mediaQueryRepository = new SequelizeMediaQueryRepository({ sequelize });
    await mediaRepository.sync();

    const user = new User(new UserId('user001'));
    user.addFavorite(new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));

    await unitOfWork.run(async () => {
      await mediaRepository.save(new Media(
        new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        new MediaTitle('お気に入り作品'),
        [new ContentId('content-001')],
        [new Tag(new Category('作者'), new Label('山田'))],
        [new Category('作者')],
      ));
      await userRepository.save(user);
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
      callback(null, `<!DOCTYPE html><html lang="ja"><head><title>${options.pageTitle}</title></head><body>${filePath}:${options.mediaOverviews[0]?.title ?? ''}</body></html>`);
    });

    app.use((req, _res, next) => {
      req.session = { session_token: req.header('x-session-token') };
      req.context = {};
      next();
    });

    setRouterScreenFavoriteGet({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([['valid-token', 'user001']]),
      }),
      getFavoriteSummariesService: new GetFavoriteSummariesService({ userRepository, mediaQueryRepository }),
    });

    app.use(router);
    return app;
  };

  test('GET /screen/favorite でお気に入り一覧を描画する', async () => {
    const response = await requestApp({
      app: createApp(),
      targetPath: '/screen/favorite',
      headers: { 'x-session-token': 'valid-token' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.bodyText).toContain('<title>お気に入り一覧</title>');
    expect(response.bodyText).toContain(path.join('src', 'views', 'screen', 'favorite.ejs'));
    expect(response.bodyText).toContain('お気に入り作品');
  });
});
