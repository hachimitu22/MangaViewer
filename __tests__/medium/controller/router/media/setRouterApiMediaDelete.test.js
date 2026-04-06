const express = require('express');
const request = require('supertest');
const { Sequelize } = require('sequelize');
const { extractSessionTokenFromCookie } = require('../../../../helpers/extractSessionTokenFromCookie');

const setRouterApiMediaDelete = require('../../../../../src/controller/router/media/setRouterApiMediaDelete');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const SequelizeMediaRepository = require('../../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeUnitOfWork = require('../../../../../src/infrastructure/SequelizeUnitOfWork');
const { DeleteMediaService } = require('../../../../../src/application/media/command/DeleteMediaService');
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

describe('setRouterApiMediaDelete (middle)', () => {
  let sequelize;
  let unitOfWork;
  let mediaRepository;
  const mediaId = '1234567890abcdef1234567890abcdef';

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    mediaRepository = new SequelizeMediaRepository({
      sequelize,
      unitOfWorkContext: unitOfWork,
    });
    await mediaRepository.sync();

    await unitOfWork.run(async () => {
      await mediaRepository.save(new Media(
        new MediaId(mediaId),
        new MediaTitle('before title'),
        [new ContentId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')],
        [new Tag(new Category('作者'), new Label('旧作者'))],
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

    app.use((req, _res, next) => {
      req.session = { session_token: extractSessionTokenFromCookie(req.header('cookie')) };
      req.context = {};
      next();
    });

    setRouterApiMediaDelete({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([['valid-token', 'user-001']]),
      }),
      deleteMediaService: new DeleteMediaService({ mediaRepository, unitOfWork }),
    });

    app.use(router);
    return app;
  };

  test('DELETE /api/media/:mediaId で正常削除できる', async () => {
    const app = createApp();

    const response = await request(app)
      .delete(`/api/media/${mediaId}`)
      .set('cookie', 'session_token=valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0 });

    const media = await mediaRepository.findByMediaId(new MediaId(mediaId));
    expect(media).toBeNull();
  });

  test('削除対象が存在しない場合は code=1 を返す', async () => {
    const app = createApp();

    const response = await request(app)
      .delete('/api/media/ffffffffffffffffffffffffffffffff')
      .set('cookie', 'session_token=valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });

  test('認証失敗時は 401 を返し既存メディアを保持する', async () => {
    const app = createApp();

    const response = await request(app)
      .delete(`/api/media/${mediaId}`)
      .set('cookie', 'session_token=invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: '認証に失敗しました',
    });

    const media = await mediaRepository.findByMediaId(new MediaId(mediaId));
    expect(media).not.toBeNull();
  });
});
