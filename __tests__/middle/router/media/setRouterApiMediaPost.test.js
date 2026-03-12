const express = require('express');
const request = require('supertest');

const setRouterApiMediaPost = require('../../../../src/controller/router/media/setRouterApiMediaPost');
const Media = require('../../../../src/domain/media/media');

class RouterCollector {
  constructor() {
    this.routes = [];
  }

  post(path, ...handlers) {
    this.routes.push({ method: 'post', path, handlers });
  }
}

class AuthResolver {
  constructor(resolver = token => `user:${token}`) {
    this.resolver = resolver;
  }

  async execute(token) {
    return this.resolver(token);
  }
}

class SaveResolver {
  constructor({ save = contents => contents.map((_, index) => `c${index + 1}`) } = {}) {
    this.save = save;
    this.lastInput = null;
  }

  async execute(contents) {
    this.lastInput = contents;
    return this.save(contents);
  }
}

class MediaIdValueGenerator {
  constructor({ mediaId = 'm1' } = {}) {
    this.mediaId = mediaId;
  }

  generate() {
    return this.mediaId;
  }
}

class MediaRepository {
  constructor({ failOnSave = false } = {}) {
    this.failOnSave = failOnSave;
    this.saved = [];
  }

  async save(media) {
    if (this.failOnSave) {
      throw new Error('db error');
    }

    this.saved.push(media);
  }
}

class UnitOfWork {
  constructor() {
    this.runCount = 0;
  }

  async run(work) {
    this.runCount += 1;
    return work();
  }
}

describe('setRouterApiMediaPost middle', () => {
  const createDependencies = (overrides = {}) => ({
    authResolver: overrides.authResolver ?? new AuthResolver(() => 'u1'),
    saveResolver: overrides.saveResolver ?? new SaveResolver(),
    mediaIdValueGenerator: overrides.mediaIdValueGenerator ?? new MediaIdValueGenerator({ mediaId: 'm1' }),
    mediaRepository: overrides.mediaRepository ?? new MediaRepository(),
    unitOfWork: overrides.unitOfWork ?? new UnitOfWork(),
  });

  const createBody = (overrides = {}) => ({
    title: 'sample title',
    contents: [
      { file: { name: '2.png' }, position: 2 },
      { file: { name: '1.png' }, position: 1 },
    ],
    tags: [
      { category: '作者', label: '山田' },
      { category: 'ジャンル', label: 'バトル' },
    ],
    ...overrides,
  });

  const createApp = (dependencies) => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const token = req.get('x-session-token');
      if (typeof token === 'string' && token.length > 0) {
        req.session = { session_token: token };
      }

      next();
    });

    const router = express.Router();
    setRouterApiMediaPost({
      router,
      ...dependencies,
    });
    app.use(router);

    return app;
  };

  test('POST /api/media に認証・保存・登録の順でハンドラーを登録できる', () => {
    const router = new RouterCollector();

    setRouterApiMediaPost({
      router,
      ...createDependencies(),
    });

    expect(router.routes).toHaveLength(1);
    expect(router.routes[0].path).toBe('/api/media');
    expect(router.routes[0].handlers).toHaveLength(3);
  });

  test('POST /api/media で認証・保存・登録の統合フローが成功する', async () => {
    const dependencies = createDependencies();
    const app = createApp(dependencies);

    const response = await request(app)
      .post('/api/media')
      .set('x-session-token', 'token-1')
      .send(createBody());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0, mediaId: 'm1' });

    expect(dependencies.saveResolver.lastInput).toEqual([
      { file: { name: '1.png' }, position: 1 },
      { file: { name: '2.png' }, position: 2 },
    ]);

    expect(dependencies.mediaRepository.saved).toHaveLength(1);
    const savedMedia = dependencies.mediaRepository.saved[0];
    expect(savedMedia).toBeInstanceOf(Media);
    expect(savedMedia.getId().getId()).toBe('m1');
    expect(savedMedia.getContents().map(content => content.getId())).toEqual(['c1', 'c2']);
    expect(savedMedia.getPriorityCategories().map(category => category.getValue())).toEqual(['作者', 'ジャンル']);
  });

  test('session未設定の場合は401を返し後続処理を実行しない', async () => {
    const dependencies = createDependencies();
    const app = createApp(dependencies);

    const response = await request(app)
      .post('/api/media')
      .send(createBody());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: '認証に失敗しました' });
    expect(dependencies.saveResolver.lastInput).toBeNull();
    expect(dependencies.mediaRepository.saved).toHaveLength(0);
  });

  test('authResolverが空文字を返す場合は401を返す', async () => {
    const dependencies = createDependencies({
      authResolver: new AuthResolver(() => ''),
    });
    const app = createApp(dependencies);

    const response = await request(app)
      .post('/api/media')
      .set('x-session-token', 'token-1')
      .send(createBody());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: '認証に失敗しました' });
    expect(dependencies.saveResolver.lastInput).toBeNull();
    expect(dependencies.mediaRepository.saved).toHaveLength(0);
  });

  test('contentsが不正な場合はcode=1を返し登録しない', async () => {
    const dependencies = createDependencies();
    const app = createApp(dependencies);

    const response = await request(app)
      .post('/api/media')
      .set('x-session-token', 'token-1')
      .send(createBody({
        contents: [
          { file: { name: '1.png' }, position: 1 },
          { file: { name: '2.png' }, position: 3 },
        ],
      }));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
    expect(dependencies.saveResolver.lastInput).toBeNull();
    expect(dependencies.mediaRepository.saved).toHaveLength(0);
  });

  test('saveResolverの戻り値が不正な場合はcode=1を返し登録しない', async () => {
    const dependencies = createDependencies({
      saveResolver: new SaveResolver({
        save: () => ['c1'],
      }),
    });
    const app = createApp(dependencies);

    const response = await request(app)
      .post('/api/media')
      .set('x-session-token', 'token-1')
      .send(createBody());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
    expect(dependencies.saveResolver.lastInput).toEqual([
      { file: { name: '1.png' }, position: 1 },
      { file: { name: '2.png' }, position: 2 },
    ]);
    expect(dependencies.mediaRepository.saved).toHaveLength(0);
  });

  test('titleが空文字の場合はcode=1を返し登録しない', async () => {
    const dependencies = createDependencies();
    const app = createApp(dependencies);

    const response = await request(app)
      .post('/api/media')
      .set('x-session-token', 'token-1')
      .send(createBody({ title: '' }));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
    expect(dependencies.saveResolver.lastInput).toEqual([
      { file: { name: '1.png' }, position: 1 },
      { file: { name: '2.png' }, position: 2 },
    ]);
    expect(dependencies.mediaRepository.saved).toHaveLength(0);
  });

  test('mediaRepository.saveが失敗した場合はcode=1を返す', async () => {
    const dependencies = createDependencies({
      mediaRepository: new MediaRepository({ failOnSave: true }),
    });
    const app = createApp(dependencies);

    const response = await request(app)
      .post('/api/media')
      .set('x-session-token', 'token-1')
      .send(createBody());

    expect(dependencies.unitOfWork.runCount).toBe(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });

  test('authResolverが不正な場合は初期化時に例外となる', () => {
    const router = new RouterCollector();

    expect(() => {
      setRouterApiMediaPost({
        router,
        ...createDependencies({ authResolver: {} }),
      });
    }).toThrow();
  });
});
