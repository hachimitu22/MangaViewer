const express = require('express');
const request = require('supertest');

const LoginPostController = require('../../../../src/controller/api/LoginPostController');
const LogoutPostController = require('../../../../src/controller/api/LogoutPostController');
const MediaPostController = require('../../../../src/controller/api/MediaPostController');
const MediaPatchController = require('../../../../src/controller/api/MediaPatchController');
const MediaDeleteController = require('../../../../src/controller/api/MediaDeleteController');
const { LoginSucceededResult, LoginFailedResult } = require('../../../../src/application/user/command/LoginService');
const { LogoutSucceededResult, LogoutFailedResult } = require('../../../../src/application/user/command/LogoutService');

const createApp = ({ loginService, logoutService, registerMediaService, updateMediaService, deleteMediaService }) => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.session = { session_id: 'sess-001' };
    req.context = req.context ?? {};
    next();
  });

  app.post('/login', (req, res) => new LoginPostController({ loginService }).execute(req, res));
  app.post('/logout', (req, res) => new LogoutPostController({ logoutService }).execute(req, res));
  app.post('/media', (req, res) => new MediaPostController({ registerMediaService }).execute(req, res));
  app.patch('/media/:mediaId', (req, res) => new MediaPatchController({ updateMediaService }).execute(req, res));
  app.delete('/media/:mediaId', (req, res) => new MediaDeleteController({ deleteMediaService }).execute(req, res));

  return app;
};

describe('API controllers (middle)', () => {
  test('normal: LoginPostController は cookie 付きで code=0 を返す', async () => {
    const app = createApp({
      loginService: {
        execute: jest.fn(async () => new LoginSucceededResult({ sessionToken: 'token-001' })),
      },
      logoutService: { execute: jest.fn(async () => new LogoutSucceededResult()) },
      registerMediaService: { execute: jest.fn(async () => ({ mediaId: 'media-001' })) },
      updateMediaService: { execute: jest.fn(async () => undefined) },
      deleteMediaService: { execute: jest.fn(async () => undefined) },
    });

    const response = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'secret' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 0 });
    expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringMatching(/session_token=token-001/),
    ]));
  });

  test('business: Login / Logout の失敗結果を code=1 で返す', async () => {
    const app = createApp({
      loginService: {
        execute: jest.fn(async () => new LoginFailedResult()),
      },
      logoutService: {
        execute: jest.fn(async () => new LogoutFailedResult()),
      },
      registerMediaService: { execute: jest.fn(async () => ({ mediaId: 'media-001' })) },
      updateMediaService: { execute: jest.fn(async () => undefined) },
      deleteMediaService: { execute: jest.fn(async () => undefined) },
    });

    await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrong' })
      .expect(200, { code: 1 });

    await request(app)
      .post('/logout')
      .send({})
      .expect(200, { code: 1 });
  });

  test('normal: MediaPost / MediaPatch / MediaDelete が HTTP レベルで成功レスポンスを返す', async () => {
    const registerMediaService = { execute: jest.fn(async () => ({ mediaId: 'media-001' })) };
    const updateMediaService = { execute: jest.fn(async () => undefined) };
    const deleteMediaService = { execute: jest.fn(async () => undefined) };
    const app = createApp({
      loginService: { execute: jest.fn(async () => new LoginFailedResult()) },
      logoutService: { execute: jest.fn(async () => new LogoutSucceededResult()) },
      registerMediaService,
      updateMediaService,
      deleteMediaService,
    });

    app.use((req, _res, next) => {
      req.context = { contentIds: ['content-001', 'content-002'] };
      next();
    });

    const mediaPost = express();
    mediaPost.use(express.json());
    mediaPost.use((req, _res, next) => {
      req.session = { session_id: 'sess-001' };
      req.context = { contentIds: ['content-001', 'content-002'] };
      next();
    });
    mediaPost.post('/media', (req, res) => new MediaPostController({ registerMediaService }).execute(req, res));
    mediaPost.patch('/media/:mediaId', (req, res) => new MediaPatchController({ updateMediaService }).execute(req, res));
    mediaPost.delete('/media/:mediaId', (req, res) => new MediaDeleteController({ deleteMediaService }).execute(req, res));

    await request(mediaPost)
      .post('/media')
      .send({
        title: 'sample title',
        tags: [
          { category: '作者', label: '山田' },
          { category: 'シリーズ', label: '特集' },
          { category: '作者', label: '佐藤' },
        ],
      })
      .expect(200, { code: 0, mediaId: 'media-001' });

    expect(registerMediaService.execute).toHaveBeenCalledWith(expect.objectContaining({
      title: 'sample title',
      contents: ['content-001', 'content-002'],
      priorityCategories: ['作者', 'シリーズ'],
    }));

    await request(mediaPost)
      .patch('/media/media-001')
      .send({
        title: 'updated title',
        tags: [
          { category: '作者', label: '山田' },
          { category: 'ジャンル', label: 'バトル' },
          { category: '作者', label: '鈴木' },
        ],
      })
      .expect(200, { code: 0 });

    expect(updateMediaService.execute).toHaveBeenCalledWith(expect.objectContaining({
      id: 'media-001',
      title: 'updated title',
      contents: ['content-001', 'content-002'],
      priorityCategories: ['作者', 'ジャンル'],
    }));

    await request(mediaPost)
      .delete('/media/media-001')
      .expect(200, { code: 0 });
  });

  test('technical: Media 系 controller は不正入力やサービス例外でも code=1 を返す', async () => {
    const mediaApp = express();
    mediaApp.use(express.json());
    mediaApp.use((req, _res, next) => {
      req.session = { session_id: 'sess-001' };
      req.context = { contentIds: ['content-001', 'content-001'] };
      next();
    });
    mediaApp.post('/media', (req, res) => new MediaPostController({
      registerMediaService: {
        execute: jest.fn(async () => {
          throw new Error('unexpected');
        }),
      },
    }).execute(req, res));
    mediaApp.patch('/media/:mediaId', (req, res) => new MediaPatchController({
      updateMediaService: {
        execute: jest.fn(async () => {
          throw new Error('unexpected');
        }),
      },
    }).execute(req, res));
    mediaApp.delete('/media/:mediaId', (req, res) => new MediaDeleteController({
      deleteMediaService: {
        execute: jest.fn(async () => {
          throw new Error('unexpected');
        }),
      },
    }).execute(req, res));

    await request(mediaApp)
      .post('/media')
      .send({ title: 'sample', tags: [{ category: '作者', label: '山田' }] })
      .expect(200, { code: 1 });

    mediaApp.use((req, _res, next) => {
      req.context = { contentIds: ['content-001'] };
      next();
    });

    const patchApp = express();
    patchApp.use(express.json());
    patchApp.use((req, _res, next) => {
      req.context = { contentIds: ['content-001'] };
      next();
    });
    patchApp.patch('/media/:mediaId', (req, res) => new MediaPatchController({
      updateMediaService: {
        execute: jest.fn(async () => {
          throw new Error('unexpected');
        }),
      },
    }).execute(req, res));
    patchApp.delete('/media/:mediaId', (req, res) => new MediaDeleteController({
      deleteMediaService: {
        execute: jest.fn(async () => {
          throw new Error('unexpected');
        }),
      },
    }).execute(req, res));

    await request(patchApp)
      .patch('/media/media-001')
      .send({ title: 'sample', tags: [{ category: '作者', label: '山田' }] })
      .expect(200, { code: 1 });

    await request(patchApp)
      .delete('/media/media-001')
      .expect(200, { code: 1 });
  });
});
