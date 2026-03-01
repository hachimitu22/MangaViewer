const request = require('supertest');
const express = require('express');
const createPostApiMediaRoute = require('../../../src/presentation/postApiMediaRoute');

describe('POST /api/media route (small)', () => {
  const createApp = (overrides = {}) => {
    const deps = {
      sessionValidator: {
        validate: jest.fn().mockResolvedValue(true),
      },
      contentStorage: {
        save: jest.fn().mockResolvedValue('content-1'),
      },
      registerMediaService: {
        execute: jest.fn().mockResolvedValue({ mediaId: 'media-1' }),
      },
      ...overrides,
    };

    const app = express();
    app.use('/api/media', createPostApiMediaRoute(deps));
    return { app, deps };
  };

  const validCookie = ['session_token=valid-token'];

  test('メディア登録が成功する', async () => {
    const { app, deps } = createApp();

    const response = await request(app)
      .post('/api/media')
      .set('Cookie', validCookie)
      .field('title', 'サンプルタイトル')
      .field('contents', JSON.stringify([
        { file: 'example1.jpg', position: 1 },
        { file: 'example2.png', position: 2 },
      ]))
      .field('tags', JSON.stringify([
        { category: '作者', label: '新井太郎' },
      ]))
      .attach('images', Buffer.from('dummy-1'), 'example1.jpg')
      .attach('images', Buffer.from('dummy-2'), 'example2.png');

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ mediaId: 'media-1' });
    expect(deps.sessionValidator.validate).toHaveBeenCalledWith('valid-token');
    expect(deps.contentStorage.save).toHaveBeenCalled();
    expect(deps.registerMediaService.execute).toHaveBeenCalled();
  });

  test('タグが未指定でもメディア登録が成功する', async () => {
    const { app, deps } = createApp();

    const response = await request(app)
      .post('/api/media')
      .set('Cookie', validCookie)
      .field('title', 'サンプルタイトル')
      .field('contents', JSON.stringify([{ file: 'example1.jpg', position: 1 }]))
      .attach('images', Buffer.from('dummy'), 'example1.jpg');

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ mediaId: 'media-1' });
    expect(deps.registerMediaService.execute).toHaveBeenCalled();
  });

  test('タグが重複していてもメディア登録が成功する', async () => {
    const { app, deps } = createApp();

    const response = await request(app)
      .post('/api/media')
      .set('Cookie', validCookie)
      .field('title', 'サンプルタイトル')
      .field('contents', JSON.stringify([{ file: 'example1.jpg', position: 1 }]))
      .field('tags', JSON.stringify([
        { category: '作者', label: '新井太郎' },
        { category: '作者', label: '新井太郎' },
      ]))
      .attach('images', Buffer.from('dummy'), 'example1.jpg');

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ mediaId: 'media-1' });
    expect(deps.registerMediaService.execute).toHaveBeenCalled();
  });

  test('セッションIDが未指定の場合は401を返す', async () => {
    const { app, deps } = createApp();

    const response = await request(app)
      .post('/api/media')
      .field('title', 'サンプルタイトル')
      .field('contents', JSON.stringify([{ file: 'example1.jpg', position: 1 }]))
      .attach('images', Buffer.from('dummy'), 'example1.jpg');

    expect(response.status).toBe(401);
    expect(deps.sessionValidator.validate).not.toHaveBeenCalled();
    expect(deps.registerMediaService.execute).not.toHaveBeenCalled();
  });

  test('セッションが無効の場合は401を返す', async () => {
    const { app, deps } = createApp({
      sessionValidator: {
        validate: jest.fn().mockResolvedValue(false),
      },
    });

    const response = await request(app)
      .post('/api/media')
      .set('Cookie', validCookie)
      .field('title', 'サンプルタイトル')
      .field('contents', JSON.stringify([{ file: 'example1.jpg', position: 1 }]))
      .attach('images', Buffer.from('dummy'), 'example1.jpg');

    expect(response.status).toBe(401);
    expect(deps.sessionValidator.validate).toHaveBeenCalledWith('valid-token');
    expect(deps.registerMediaService.execute).not.toHaveBeenCalled();
  });

  test('コンテンツ一覧が空の場合は登録失敗を返す', async () => {
    const { app, deps } = createApp();

    const response = await request(app)
      .post('/api/media')
      .set('Cookie', validCookie)
      .field('title', 'サンプルタイトル')
      .field('contents', JSON.stringify([]));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
    expect(deps.contentStorage.save).not.toHaveBeenCalled();
    expect(deps.registerMediaService.execute).not.toHaveBeenCalled();
  });

  test('コンテンツ保存に失敗した場合は登録失敗を返す', async () => {
    const { app, deps } = createApp({
      contentStorage: {
        save: jest.fn().mockRejectedValue(new Error('storage error')),
      },
    });

    const response = await request(app)
      .post('/api/media')
      .set('Cookie', validCookie)
      .field('title', 'サンプルタイトル')
      .field('contents', JSON.stringify([{ file: 'example1.jpg', position: 1 }]))
      .attach('images', Buffer.from('dummy'), 'example1.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
    expect(deps.registerMediaService.execute).not.toHaveBeenCalled();
  });

  test('メディア永続化に失敗した場合は登録失敗を返す', async () => {
    const { app } = createApp({
      registerMediaService: {
        execute: jest.fn().mockRejectedValue(new Error('db error')),
      },
    });

    const response = await request(app)
      .post('/api/media')
      .set('Cookie', validCookie)
      .field('title', 'サンプルタイトル')
      .field('contents', JSON.stringify([{ file: 'example1.jpg', position: 1 }]))
      .attach('images', Buffer.from('dummy'), 'example1.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 1 });
  });
});
