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
const { waitForApiResponse } = require('../support/api-response');
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


test.describe('large e2e: 詳細画面から favorite/queue の追加と解除を行う', () => {
  const seedMediaId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const seedTitle = 'お気に入りとあとで見る対象タイトル';

  let app;
  let server;
  let baseUrl;
  let tempRootDirectory;
  let tempDatabasePath;
  let tempContentDirectory;

  test.beforeEach(async ({ page: currentPage }) => {
    page = currentPage;
    tempRootDirectory = await createE2eTempDirectory('mangaviewer-e2e-detail-');
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
        contentId: 'seed/detail-content-1.jpg',
      }));
    });

    await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
    await fs.writeFile(path.join(tempContentDirectory, 'seed', 'detail-content-1.jpg'), 'dummy', { encoding: 'utf8' });

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

  test('詳細画面の favorite/queue 追加と解除が一覧画面に反映される', async () => {
    await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle' });

    await page.type('#username', 'admin');
    await page.type('#password', 'admin');

    const loginResponsePromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: '/api/login',
      method: 'POST',
    });

    await Promise.all([
      page.waitForURL(`${baseUrl}/screen/summary`, { waitUntil: 'networkidle' }),
      page.click('button[type="submit"]'),
    ]);

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);
    expect(page.url()).toBe(`${baseUrl}/screen/summary`);

    await page.goto(`${baseUrl}/screen/detail/${seedMediaId}`, { waitUntil: 'networkidle' });

    const favoriteAddResponsePromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/favorite/${seedMediaId}`,
      method: 'PUT',
    });
    await page.click('#favorite-add');
    const favoriteAddResponse = await favoriteAddResponsePromise;
    expect(favoriteAddResponse.status()).toBe(200);

    await page.goto(`${baseUrl}/screen/favorite`, { waitUntil: 'networkidle' });
    await page.waitForSelector(`[data-media-id="${seedMediaId}"]`);

    const favoriteText = await page.evaluate(() => document.body.innerText);
    expect(favoriteText).toContain(seedTitle);

    await page.goto(`${baseUrl}/screen/detail/${seedMediaId}`, { waitUntil: 'networkidle' });

    const queueAddResponsePromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/queue/${seedMediaId}`,
      method: 'PUT',
    });
    await page.click('#queue-add');
    const queueAddResponse = await queueAddResponsePromise;
    expect(queueAddResponse.status()).toBe(200);

    await page.goto(`${baseUrl}/screen/queue`, { waitUntil: 'networkidle' });
    await page.waitForSelector(`[data-media-id="${seedMediaId}"]`);

    const queueText = await page.evaluate(() => document.body.innerText);
    expect(queueText).toContain(seedTitle);

    await page.goto(`${baseUrl}/screen/favorite`, { waitUntil: 'networkidle' });

    const favoriteDeleteResponsePromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/favorite/${seedMediaId}`,
      method: 'DELETE',
    });
    await page.click(`[data-media-id="${seedMediaId}"] .js-favorite-remove`);
    const favoriteDeleteResponse = await favoriteDeleteResponsePromise;
    expect(favoriteDeleteResponse.status()).toBe(200);

    await page.waitForFunction(
      mediaId => !document.querySelector(`[data-media-id="${mediaId}"]`),
      {},
      seedMediaId,
    );

    await page.goto(`${baseUrl}/screen/queue`, { waitUntil: 'networkidle' });

    const queueDeleteResponsePromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/queue/${seedMediaId}`,
      method: 'DELETE',
    });
    await page.click(`[data-media-id="${seedMediaId}"] .js-queue-toggle`);
    const queueDeleteResponse = await queueDeleteResponsePromise;
    expect(queueDeleteResponse.status()).toBe(200);

    await page.goto(`${baseUrl}/screen/queue`, { waitUntil: 'networkidle' });
    const remainingQueueCard = await page.$(`[data-media-id="${seedMediaId}"]`);
    expect(remainingQueueCard).toBeNull();
  });
});
