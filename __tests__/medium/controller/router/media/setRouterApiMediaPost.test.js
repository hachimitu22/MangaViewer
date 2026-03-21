const express = require('express');
const request = require('supertest');
const multer = require('multer');
const { Sequelize } = require('sequelize');

const setRouterApiMediaPost = require('../../../../../src/controller/router/media/setRouterApiMediaPost');
const SessionStateAuthAdapter = require('../../../../../src/infrastructure/SessionStateAuthAdapter');
const SequelizeMediaRepository = require('../../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeUnitOfWork = require('../../../../../src/infrastructure/SequelizeUnitOfWork');
const MediaId = require('../../../../../src/domain/media/mediaId');

class InMemorySessionStateStore {
  constructor(entries = []) {
    this.tokenToUserId = new Map(entries);
  }

  findUserIdBySessionToken(sessionToken) {
    return this.tokenToUserId.get(sessionToken) ?? null;
  }
}

class FixedMediaIdValueGenerator {
  generate() {
    return '1234567890abcdef1234567890abcdef';
  }
}

const createContentUploadAdapter = () => {
  const upload = multer({ storage: multer.memoryStorage() }).any();

  return {
    execute: (req, res, cb) => {
      upload(req, res, error => {
        if (error) {
          cb(error);
          return;
        }

        const contents = (req.files ?? []).map(file => {
          const matched = file.fieldname.match(/^contents\[(\d+)\]\[file\]$/);
          if (!matched) {
            return null;
          }

          const index = matched[1];
          const position = Number(req.body?.contents?.[index]?.position);
          const url = req.body?.contents?.[index]?.url;
          if (!Number.isInteger(position) || position < 1) {
            return null;
          }
          if (!(typeof url === 'string' && url.length > 0)) {
            return null;
          }

          return {
            position,
            contentId: url,
          };
        }).filter(content => content !== null);

        req.context = req.context ?? {};
        req.context.contentIds = contents
          .sort((a, b) => a.position - b.position)
          .map(content => content.contentId);

        cb();
      });
    },
  };
};

describe('setRouterApiMediaPost (middle)', () => {
  let sequelize;
  let unitOfWork;
  let mediaRepository;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    mediaRepository = new SequelizeMediaRepository({
      sequelize,
      unitOfWorkContext: unitOfWork,
    });
    await mediaRepository.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  const createApp = () => {
    const app = express();
    const router = express.Router();

    app.use((req, _res, next) => {
      req.session = {
        session_token: req.header('x-session-token'),
      };
      req.context = {};
      next();
    });

    setRouterApiMediaPost({
      router,
      authResolver: new SessionStateAuthAdapter({
        sessionStateStore: new InMemorySessionStateStore([
          ['valid-token', 'user-001'],
        ]),
      }),
      saveAdapter: createContentUploadAdapter(),
      mediaIdValueGenerator: new FixedMediaIdValueGenerator(),
      mediaRepository,
      unitOfWork,
    });

    app.use(router);
    return app;
  };

  test('POST /api/media で認証・保存・登録が連携し、永続化まで完了する', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/media')
      .set('x-session-token', 'valid-token')
      .field('title', 'sample title')
      .field('tags[0][category]', '作者')
      .field('tags[0][label]', '山田')
      .field('tags[1][category]', 'ジャンル')
      .field('tags[1][label]', 'バトル')
      .field('tags[2][category]', '作者')
      .field('tags[2][label]', '佐藤')
      .field('contents[0][position]', '2')
      .field('contents[0][url]', '/content/2')
      .attach('contents[0][file]', Buffer.from('b'), 'second.jpg')
      .field('contents[1][position]', '1')
      .field('contents[1][url]', '/content/1')
      .attach('contents[1][file]', Buffer.from('a'), 'first.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      code: 0,
      mediaId: '1234567890abcdef1234567890abcdef',
    });

    const media = await mediaRepository.findByMediaId(
      new MediaId('1234567890abcdef1234567890abcdef')
    );

    expect(media).not.toBeNull();
    expect(media.getTitle().getTitle()).toBe('sample title');
    expect(media.getContents().map(content => content.getId())).toEqual([
      '/content/1',
      '/content/2',
    ]);
    expect(media.getTags().map(tag => ({
      category: tag.getCategory().getValue(),
      label: tag.getLabel().getLabel(),
    }))).toEqual(expect.arrayContaining([
      { category: '作者', label: '山田' },
      { category: 'ジャンル', label: 'バトル' },
      { category: '作者', label: '佐藤' },
    ]));
    expect(media.getPriorityCategories().map(category => category.getValue())).toEqual([
      '作者',
      'ジャンル',
    ]);
  });

  test('不正なセッショントークンでは 401 を返し、永続化しない', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/media')
      .set('x-session-token', 'invalid-token')
      .field('title', 'sample title')
      .field('tags[0][category]', '作者')
      .field('tags[0][label]', '山田')
      .field('contents[0][position]', '1')
      .field('contents[0][url]', '/content/1')
      .attach('contents[0][file]', Buffer.from('a'), 'first.jpg');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: '認証に失敗しました',
    });

    const media = await mediaRepository.findByMediaId(
      new MediaId('1234567890abcdef1234567890abcdef')
    );
    expect(media).toBeNull();
  });
});
