const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Sequelize } = require('sequelize');
const { extractSessionTokenFromCookie } = require('../../../../helpers/extractSessionTokenFromCookie');

const setRouterApiMediaPatch = require('../../../../../src/controller/router/media/setRouterApiMediaPatch');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const SequelizeMediaRepository = require('../../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeUnitOfWork = require('../../../../../src/infrastructure/SequelizeUnitOfWork');
const MulterDiskStorageContentUploadAdapter = require('../../../../../src/infrastructure/MulterDiskStorageContentUploadAdapter');
const { UpdateMediaService } = require('../../../../../src/application/media/command/UpdateMediaService');
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

describe('setRouterApiMediaPatch (middle)', () => {
  let sequelize;
  let unitOfWork;
  let mediaRepository;
  let rootDirectory;
  const mediaId = '1234567890abcdef1234567890abcdef';
  const existingContent1 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const existingContent2 = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  beforeEach(async () => {
    rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'router-media-patch-'));
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
        [new ContentId(existingContent1), new ContentId(existingContent2)],
        [new Tag(new Category('作者'), new Label('旧作者'))],
        [new Category('作者')],
      ));
    });
  });

  afterEach(async () => {
    fs.rmSync(rootDirectory, { recursive: true, force: true });
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

    setRouterApiMediaPatch({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([['valid-token', 'user-001']]),
      }),
      saveAdapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory }),
      updateMediaService: new UpdateMediaService({ mediaRepository, unitOfWork }),
    });

    app.use(router);
    return app;
  };

  test('PATCH /api/media/:mediaId でタイトル変更・並び替え・新規画像追加まで完了する', async () => {
    const app = createApp();

    const response = await request(app)
      .patch(`/api/media/${mediaId}`)
      .set('cookie', 'session_token=valid-token')
      .field('title', 'after title')
      .field('tags[0][category]', '作者')
      .field('tags[0][label]', '新作者')
      .field('tags[1][category]', '雑誌')
      .field('tags[1][label]', 'ジャンプ')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from([0xff, 0xd8, 0xff, 0xdb]), 'new.jpg')
      .field('contents[1][position]', '2')
      .field('contents[1][id]', existingContent2)
      .field('contents[2][position]', '3')
      .field('contents[2][id]', existingContent1);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0 });

    const media = await mediaRepository.findByMediaId(new MediaId(mediaId));
    expect(media.getTitle().getTitle()).toBe('after title');
    expect(media.getContents().map(content => content.getId())).toEqual([
      expect.stringMatching(/^[0-9a-f]{32}$/),
      existingContent2,
      existingContent1,
    ]);
    expect(media.getTags().map(tag => ({
      category: tag.getCategory().getValue(),
      label: tag.getLabel().getLabel(),
    }))).toEqual(expect.arrayContaining([
      { category: '作者', label: '新作者' },
      { category: '雑誌', label: 'ジャンプ' },
    ]));
    expect(media.getPriorityCategories().map(category => category.getValue())).toEqual([
      '作者',
      '雑誌',
    ]);
  });

  test('入力不正な場合は code=1 を返して既存メディアを変更しない', async () => {
    const app = createApp();

    const response = await request(app)
      .patch(`/api/media/${mediaId}`)
      .set('cookie', 'session_token=valid-token')
      .field('title', '')
      .field('tags[0][category]', '作者')
      .field('tags[0][label]', '新作者')
      .field('contents[0][position]', '1')
      .field('contents[0][id]', existingContent1);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });

    const media = await mediaRepository.findByMediaId(new MediaId(mediaId));
    expect(media.getTitle().getTitle()).toBe('before title');
    expect(media.getContents().map(content => content.getId())).toEqual([
      existingContent1,
      existingContent2,
    ]);
  });
});
