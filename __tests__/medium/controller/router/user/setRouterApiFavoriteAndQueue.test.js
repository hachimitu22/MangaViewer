const express = require('express');
const request = require('supertest');
const { Sequelize } = require('sequelize');
const { extractSessionTokenFromCookie } = require('../../../../helpers/extractSessionTokenFromCookie');

const setRouterApiFavoriteAndQueue = require('../../../../../src/controller/router/user/setRouterApiFavoriteAndQueue');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const SequelizeMediaRepository = require('../../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeMediaQueryRepository = require('../../../../../src/infrastructure/SequelizeMediaQueryRepository');
const SequelizeUserRepository = require('../../../../../src/infrastructure/SequelizeUserRepository');
const SequelizeUnitOfWork = require('../../../../../src/infrastructure/SequelizeUnitOfWork');
const { AddFavoriteService } = require('../../../../../src/application/user/command/AddFavoriteService');
const { RemoveFavoriteService } = require('../../../../../src/application/user/command/RemoveFavoriteService');
const { AddQueueService } = require('../../../../../src/application/user/command/AddQueueService');
const { RemoveQueueService } = require('../../../../../src/application/user/command/RemoveQueueService');
const User = require('../../../../../src/domain/user/user');
const UserId = require('../../../../../src/domain/user/userId');
const Media = require('../../../../../src/domain/media/media');
const MediaId = require('../../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../../src/domain/media/contentId');
const Tag = require('../../../../../src/domain/media/tag');
const Category = require('../../../../../src/domain/media/category');
const Label = require('../../../../../src/domain/media/label');

const extractCsrfTokenFromCookie = cookieHeader => {
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) {
    return undefined;
  }
  const pair = cookieHeader
    .split(';')
    .map(entry => entry.trim())
    .find(entry => entry.startsWith('csrf_token='));
  if (!pair) {
    return undefined;
  }
  const [, value = ''] = pair.split('=');
  return value || undefined;
};

class InMemorySessionStateStore {
  constructor(entries = []) {
    this.tokenToUserId = new Map(entries);
  }

  findUserIdBySessionToken(sessionToken) {
    return this.tokenToUserId.get(sessionToken) ?? null;
  }
}

const createMedia = ({ mediaId, title }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  [new ContentId(`${mediaId}-content-001`)],
  [new Tag(new Category('作者'), new Label('山田'))],
  [new Category('作者')],
);

describe('setRouterApiFavoriteAndQueue (middle)', () => {
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

    await unitOfWork.run(async () => {
      await mediaRepository.save(createMedia({ mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', title: '作品A' }));
      await mediaRepository.save(createMedia({ mediaId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', title: '作品B' }));
      await userRepository.save(new User(new UserId('user001')));
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  const createApp = () => {
    const app = express();
    const router = express.Router();

    app.use((req, _res, next) => {
      req.session = {
        session_token: extractSessionTokenFromCookie(req.header('cookie')),
        csrf_token: extractCsrfTokenFromCookie(req.header('cookie')),
      };
      req.context = {};
      next();
    });

    setRouterApiFavoriteAndQueue({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([['valid-token', 'user001']]),
      }),
      addFavoriteService: new AddFavoriteService({ mediaRepository, userRepository, unitOfWork }),
      removeFavoriteService: new RemoveFavoriteService({ userRepository, unitOfWork }),
      addQueueService: new AddQueueService({ mediaRepository, userRepository, unitOfWork }),
      removeQueueService: new RemoveQueueService({ userRepository, unitOfWork }),
    });

    app.use(router);
    return app;
  };

  test('favorite / queue の追加と削除が永続化まで連携する', async () => {
    const app = createApp();

    await request(app)
      .put('/api/favorite/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', 'csrf-1')
      .set('cookie', 'session_token=valid-token; csrf_token=csrf-1')
      .expect(200, { code: 0 });

    await request(app)
      .put('/api/queue/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', 'csrf-1')
      .set('cookie', 'session_token=valid-token; csrf_token=csrf-1')
      .expect(200, { code: 0 });

    let favoriteResult = await mediaQueryRepository.findOverviewsByMediaIds(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    let queueResult = await mediaQueryRepository.findOverviewsByMediaIds(['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb']);
    const userAfterAdd = await userRepository.findByUserId(new UserId('user001'));

    expect(userAfterAdd.getFavorites().map(mediaId => mediaId.getId())).toEqual(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    expect(userAfterAdd.getQueue().map(mediaId => mediaId.getId())).toEqual(['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb']);
    expect(favoriteResult[0].title).toBe('作品A');
    expect(queueResult[0].title).toBe('作品B');

    await request(app)
      .delete('/api/favorite/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', 'csrf-1')
      .set('cookie', 'session_token=valid-token; csrf_token=csrf-1')
      .expect(200, { code: 0 });

    await request(app)
      .delete('/api/queue/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', 'csrf-1')
      .set('cookie', 'session_token=valid-token; csrf_token=csrf-1')
      .expect(200, { code: 0 });

    const userAfterDelete = await userRepository.findByUserId(new UserId('user001'));
    expect(userAfterDelete.getFavorites()).toEqual([]);
    expect(userAfterDelete.getQueue()).toEqual([]);
  });

  test('未認証では 401 を返し、ユーザー状態を変更しない', async () => {
    const app = createApp();

    await request(app)
      .put('/api/favorite/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', 'csrf-1')
      .set('cookie', 'session_token=invalid-token; csrf_token=csrf-1')
      .expect(401, { message: '認証に失敗しました' });

    const user = await userRepository.findByUserId(new UserId('user001'));
    expect(user.getFavorites()).toEqual([]);
    expect(user.getQueue()).toEqual([]);
  });
});
