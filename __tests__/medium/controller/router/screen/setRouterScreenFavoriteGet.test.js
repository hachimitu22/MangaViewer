const express = require('express');
const path = require('path');
const { Sequelize } = require('sequelize');
const { extractSessionTokenFromCookie } = require('../../../../helpers/extractSessionTokenFromCookie');

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
    [
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccc',
    ].forEach(mediaId => user.addFavorite(new MediaId(mediaId)));

    await unitOfWork.run(async () => {
      await mediaRepository.save(new Media(
        new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
        new MediaTitle('あいうえお'),
        [new ContentId('content-001')],
        [new Tag(new Category('作者'), new Label('山田'))],
        [new Category('作者')],
      ));
      await mediaRepository.save(new Media(
        new MediaId('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
        new MediaTitle('かきくけこ'),
        [new ContentId('content-002')],
        [new Tag(new Category('作者'), new Label('佐藤'))],
        [new Category('作者')],
      ));
      await mediaRepository.save(new Media(
        new MediaId('cccccccccccccccccccccccccccccccc'),
        new MediaTitle('さしすせそ'),
        [new ContentId('content-003')],
        [new Tag(new Category('ジャンル'), new Label('冒険'))],
        [new Category('ジャンル')],
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
      callback(
        null,
        `<!DOCTYPE html><html lang="ja"><head><title>${options.pageTitle}</title></head><body>${filePath}:sort=${options.currentConditions.sort}:page=${options.pagination.currentPage}:titles=${options.mediaOverviews.map(media => media.title).join(',')}:thumbnail=${options.mediaOverviews[0].thumbnail}:pages=${options.pagination.items.join(',')}:tags=${options.mediaOverviews.flatMap(media => media.tags.map(tag => `/screen/summary?summaryPage=1&sort=${options.currentConditions.sort}&tags=${encodeURIComponent(`${tag.category}:${tag.label}`)}`)).join('|')}</body></html>`,
      );
    });

    app.use((req, _res, next) => {
      req.session = { session_token: extractSessionTokenFromCookie(req.header('cookie')) };
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
      headers: { cookie: 'session_token=valid-token' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.bodyText).toContain('<title>お気に入り一覧</title>');
    expect(response.bodyText).toContain(path.join('src', 'views', 'screen', 'favorite.ejs'));
    expect(response.bodyText).toContain('sort=date_asc');
    expect(response.bodyText).toContain('page=1');
    expect(response.bodyText).toContain('thumbnail=');
  });

  test('sort を変更すると指定順で描画される', async () => {
    const response = await requestApp({
      app: createApp(),
      targetPath: '/screen/favorite?sort=title_asc&page=1',
      headers: { cookie: 'session_token=valid-token' },
    });

    expect(response.bodyText).toContain('titles=あいうえお,かきくけこ,さしすせそ');
  });

  test('page を移動すると該当ページと導線情報を保持する', async () => {
    await unitOfWork.run(async () => {
      const user = await userRepository.findByUserId(new UserId('user001'));
      for (let index = 4; index <= 21; index += 1) {
        const suffix = String(index).padStart(3, '0');
        const mediaId = `ddddddddddddddddddddddddddddd${suffix}`.slice(0, 32);
        if (!user.getFavorites().some(item => item.getId() === mediaId)) {
          user.addFavorite(new MediaId(mediaId));
          await mediaRepository.save(new Media(
            new MediaId(mediaId),
            new MediaTitle(`追加作品${suffix}`),
            [new ContentId(`content-${suffix}`)],
            [new Tag(new Category('作者'), new Label(`作家${suffix}`))],
            [new Category('作者')],
          ));
        }
      }
      await userRepository.save(user);
    });

    const response = await requestApp({
      app: createApp(),
      targetPath: '/screen/favorite?sort=date_desc&page=2',
      headers: { cookie: 'session_token=valid-token' },
    });

    expect(response.bodyText).toContain('page=2');
    expect(response.bodyText).toContain('pages=1,2');
  });

  test('タグ導線が /screen/summary を向き並び順を保持する', async () => {
    const response = await requestApp({
      app: createApp(),
      targetPath: '/screen/favorite?sort=title_desc&page=1',
      headers: { cookie: 'session_token=valid-token' },
    });

    expect(response.bodyText).toContain('/screen/summary?summaryPage=1&sort=title_desc&tags=');
  });
});
