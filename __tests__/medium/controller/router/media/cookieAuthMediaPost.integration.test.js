const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Sequelize } = require('sequelize');

const setupMiddleware = require('../../../../../src/app/setupMiddleware');
const setRouterApiLogin = require('../../../../../src/controller/router/user/setRouterApiLogin');
const setRouterApiMediaPost = require('../../../../../src/controller/router/media/setRouterApiMediaPost');
const SessionStateRegistrar = require('../../../../../src/infrastructure/SessionStateRegistrar');
const InMemorySessionStateStore = require('../../../../../src/infrastructure/InMemorySessionStateStore');
const InMemoryLoginAttemptStore = require('../../../../../src/infrastructure/InMemoryLoginAttemptStore');
const StaticLoginAuthenticator = require('../../../../../src/infrastructure/StaticLoginAuthenticator');
const SequelizeMediaRepository = require('../../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeUnitOfWork = require('../../../../../src/infrastructure/SequelizeUnitOfWork');
const MulterDiskStorageContentUploadAdapter = require('../../../../../src/infrastructure/MulterDiskStorageContentUploadAdapter');
const { LoginService } = require('../../../../../src/application/user/command/LoginService');

class FixedMediaIdValueGenerator {
  generate() {
    return 'abcdefabcdefabcdefabcdefabcdefab';
  }
}

describe('Cookie認証での /api/media 回帰テスト (medium)', () => {
  let sequelize;
  let unitOfWork;
  let mediaRepository;
  let rootDirectory;

  beforeEach(async () => {
    rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'router-media-cookie-auth-'));
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    mediaRepository = new SequelizeMediaRepository({
      sequelize,
      unitOfWorkContext: unitOfWork,
    });
    await mediaRepository.sync();
  });

  afterEach(async () => {
    fs.rmSync(rootDirectory, { recursive: true, force: true });
    await sequelize.close();
  });

  const createApp = () => {
    const app = express();
    const router = express.Router();
    const sessionStateStore = new InMemorySessionStateStore();
    const loginAttemptStore = new InMemoryLoginAttemptStore();

    setupMiddleware(app, {
      env: {
        allowLegacySessionTokenHeader: 'false',
      },
      dependencies: {},
    });

    setRouterApiLogin({
      router,
      loginService: new LoginService({
        loginAuthenticator: new StaticLoginAuthenticator({
          username: 'admin',
          password: 'secret',
          userId: 'user-001',
        }),
        sessionStateRegistrar: new SessionStateRegistrar({ sessionStateStore }),
        sessionTtlMs: 60_000,
      }),
      loginAttemptStore,
    });

    const authResolver = {
      execute: jest.fn(async sessionToken => sessionStateStore.findUserIdBySessionToken(sessionToken) ?? null),
    };

    setRouterApiMediaPost({
      router,
      authResolver,
      saveAdapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory }),
      mediaIdValueGenerator: new FixedMediaIdValueGenerator(),
      mediaRepository,
      unitOfWork,
    });

    app.use(router);

    return {
      app,
      authResolver,
    };
  };

  test('ログイン後は Cookie のみで /api/media に成功し、x-session-token なしでも認証できる', async () => {
    const { app, authResolver } = createApp();

    const loginResponse = await request(app)
      .post('/api/login')
      .type('form')
      .send({ username: 'admin', password: 'secret' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toEqual({ code: 0 });
    expect(loginResponse.headers['set-cookie']).toBeDefined();

    const response = await request(app)
      .post('/api/media')
      .set('Cookie', loginResponse.headers['set-cookie'])
      .field('title', 'cookie-auth-title')
      .field('tags[0][category]', '作者')
      .field('tags[0][label]', '山田')
      .field('contents[0][position]', '1')
      .attach('contents[0][file]', Buffer.from('a'), 'first.jpg');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      code: 0,
      mediaId: 'abcdefabcdefabcdefabcdefabcdefab',
    });

    expect(authResolver.execute).toHaveBeenCalledTimes(1);
    expect(authResolver.execute.mock.calls[0][0]).toMatch(/^[0-9a-f]{32}$/);
  });
});
