const express = require('express');
const request = require('supertest');
const { Sequelize } = require('sequelize');

const setRouterApiMediaDelete = require('../../../../../src/controller/router/media/setRouterApiMediaDelete');
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
      req.context = {};
      next();
    });

    setRouterApiMediaDelete({
      router,
      adminApiToken: 'admin-token',
      deleteMediaService: new DeleteMediaService({ mediaRepository, unitOfWork }),
    });

    app.use(router);
    return app;
  };

  test('DELETE /api/media/:mediaId で正常削除できる', async () => {
    const app = createApp();

    const response = await request(app)
      .delete(`/api/media/${mediaId}`)
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', 'csrf-1')
      .set('cookie', 'csrf_token=csrf-1')
      .set('x-admin-token', 'admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0 });

    const media = await mediaRepository.findByMediaId(new MediaId(mediaId));
    expect(media).toBeNull();
  });

  test('削除対象が存在しない場合は500を返す', async () => {
    const app = createApp();

    const response = await request(app)
      .delete('/api/media/ffffffffffffffffffffffffffffffff')
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', 'csrf-1')
      .set('cookie', 'csrf_token=csrf-1')
      .set('x-admin-token', 'admin-token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal Server Error' });
  });

  test('管理者トークン未指定時は 401 を返し既存メディアを保持する', async () => {
    const app = createApp();

    const response = await request(app)
      .delete(`/api/media/${mediaId}`)
      .set('origin', 'http://127.0.0.1')
      .set('host', '127.0.0.1')
      .set('x-csrf-token', 'csrf-1')
      .set('cookie', 'csrf_token=csrf-1');

    expect(response.status).toBe(401);
    const media = await mediaRepository.findByMediaId(new MediaId(mediaId));
    expect(media).not.toBeNull();
  });
});
