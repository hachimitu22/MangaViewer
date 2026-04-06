const fs = require('fs/promises');
const path = require('path');
const { test, expect } = require('@playwright/test');

let page;

const createApp = require('../../../../src/app');
const Media = require('../../../../src/domain/media/media');
const MediaId = require('../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../src/domain/media/contentId');
const Tag = require('../../../../src/domain/media/tag');
const Category = require('../../../../src/domain/media/category');
const Label = require('../../../../src/domain/media/label');
const { createE2eTempDirectory } = require('../helpers/e2eTempDirectory');


const removePathIfExists = async targetPath => {
  if (!targetPath) {
    return;
  }

  await fs.rm(targetPath, {
    recursive: true,
    force: true,
  });
};

const createSeedMedia = ({ mediaId, title, contentId }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  [new ContentId(contentId)],
  [
    new Tag(new Category('カテゴリ'), new Label('ラベル')),
  ],
  [new Category('カテゴリ')],
);

test.describe('large e2e: サマリー・詳細遷移とログアウト後導線', () => {
  const seedMediaId = 'media-seed-navigation-1';
  const seedTitle = '遷移確認用タイトル';

  let app;
  let server;
  let baseUrl;
  let tempRootDirectory;
  let tempDatabasePath;
  let tempContentDirectory;

  test.beforeEach(async ({ page: currentPage }) => {
    page = currentPage;
    tempRootDirectory = await createE2eTempDirectory('mangaviewer-e2e-navigation-');
    tempDatabasePath = path.join(tempRootDirectory, 'db', 'test.sqlite');
    tempContentDirectory = path.join(tempRootDirectory, 'contents');

    app = createApp({
      databaseStoragePath: tempDatabasePath,
      contentRootDirectory: tempContentDirectory,
      loginUsername: 'admin',
      loginPassword: 'admin',
      loginUserId: 'admin',
      loginSessionTtlMs: 60_000,
    });

    await app.locals.ready;

    await app.locals.dependencies.unitOfWork.run(async () => {
      await app.locals.dependencies.mediaRepository.save(createSeedMedia({
        mediaId: seedMediaId,
        title: seedTitle,
        contentId: 'seed/navigation-content-1.jpg',
      }));
    });

    await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
    await fs.writeFile(path.join(tempContentDirectory, 'seed', 'navigation-content-1.jpg'), 'dummy', { encoding: 'utf8' });

    server = await new Promise((resolve, reject) => {
      const listeningServer = app.listen(0, () => resolve(listeningServer));
      listeningServer.on('error', reject);
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('テストサーバーの待受ポート解決に失敗しました');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  test.afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      });
      server = null;
    }

    if (app?.locals?.close) {
      await app.locals.close();
    }

    await removePathIfExists(tempRootDirectory);

    app = null;
    baseUrl = null;
    tempRootDirectory = null;
    tempDatabasePath = null;
    tempContentDirectory = null;
  });

  const login = async () => {
    await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle' });

    await page.type('#username', 'admin');
    await page.type('#password', 'admin');

    const loginResponsePromise = page.waitForResponse(response => {
      return response.url() === `${baseUrl}/api/login` && response.request().method() === 'POST';
    });

    await Promise.all([
      page.waitForURL(`${baseUrl}/screen/summary`, { waitUntil: 'networkidle' }),
      page.click('button[type="submit"]'),
    ]);

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);
    expect(page.url()).toBe(`${baseUrl}/screen/summary`);
  };

  test('summary -> detail -> summary 遷移後、logout で保護導線と API 認証が無効化される', async () => {
    await login();

    await expect(page.locator('nav[aria-label="共通ナビゲーター"]')).toBeVisible();
    await expect(page.locator('a[href="/screen/summary"]')).toContainText('メディア一覧');
    await expect(page.locator('a[href="/screen/favorite"]')).toContainText('お気に入り');
    await expect(page.locator('a[href="/screen/queue"]')).toContainText('あとで見る');
    await expect(page.locator('a[href="/screen/entry"]')).toContainText('メディア登録');
    await expect(page.locator('#common-nav-logout')).toBeVisible();

    await page.waitForSelector(`a[href="/screen/detail/${seedMediaId}"]`);

    const toDetailResponsePromise = page.waitForResponse(response => {
      return response.url() === `${baseUrl}/screen/detail/${seedMediaId}` && response.request().method() === 'GET';
    });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click(`a[href="/screen/detail/${seedMediaId}"]`),
    ]);

    const toDetailResponse = await toDetailResponsePromise;
    expect(toDetailResponse.status()).toBe(200);
    expect(page.url()).toBe(`${baseUrl}/screen/detail/${seedMediaId}`);
    await expect(page.locator('nav[aria-label="共通ナビゲーター"]')).toBeVisible();
    await expect(page.locator('#common-nav-logout')).toBeVisible();

    const backToSummaryResponsePromise = page.waitForResponse(response => {
      return response.url().startsWith(`${baseUrl}/screen/summary?`) && response.request().method() === 'GET';
    });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('a[href^="/screen/summary?"]'),
    ]);

    const backToSummaryResponse = await backToSummaryResponsePromise;
    expect(backToSummaryResponse.status()).toBe(200);
    expect(page.url()).toMatch(new RegExp(`^${baseUrl}/screen/summary\\?`));

    const logoutResponsePromise = page.waitForResponse(response => {
      return response.url() === `${baseUrl}/api/logout` && response.request().method() === 'POST';
    });

    await page.click('#common-nav-logout');

    const logoutResponse = await logoutResponsePromise;
    expect(logoutResponse.status()).toBe(200);
    await page.waitForURL(`${baseUrl}/screen/login`, { waitUntil: 'networkidle' });

    const protectedResponse = await page.goto(`${baseUrl}/screen/summary`, { waitUntil: 'networkidle' });
    expect(protectedResponse.status()).toBe(401);

    const loginScreenResponse = await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle' });
    expect(loginScreenResponse.status()).toBe(200);
    expect(page.url()).toBe(`${baseUrl}/screen/login`);

    const postLogoutApiResult = await page.evaluate(async mediaId => {
      const favoriteResponse = await fetch(`/api/favorite/${mediaId}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
        },
      });

      const queueResponse = await fetch(`/api/queue/${mediaId}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
        },
      });

      return {
        favorite: {
          status: favoriteResponse.status,
          body: await favoriteResponse.json(),
          url: favoriteResponse.url,
        },
        queue: {
          status: queueResponse.status,
          body: await queueResponse.json(),
          url: queueResponse.url,
        },
      };
    }, seedMediaId);

    expect(postLogoutApiResult.favorite.status).toBe(401);
    expect(postLogoutApiResult.favorite.url).toBe(`${baseUrl}/api/favorite/${seedMediaId}`);
    expect(postLogoutApiResult.favorite.body).toEqual({ message: '認証に失敗しました' });

    expect(postLogoutApiResult.queue.status).toBe(401);
    expect(postLogoutApiResult.queue.url).toBe(`${baseUrl}/api/queue/${seedMediaId}`);
    expect(postLogoutApiResult.queue.body).toEqual({ message: '認証に失敗しました' });
  });
});
