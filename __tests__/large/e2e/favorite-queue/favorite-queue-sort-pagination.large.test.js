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
const { waitForApiResponse } = require('../support/api-response');


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
    new Tag(new Category('シリーズ'), new Label('E2E')),
  ],
  [new Category('シリーズ')],
);

const createSeedMedias = (count) => {
  return Array.from({ length: count }, (_value, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      mediaId: `fq-media-${number}`,
      title: `作品 ${number}`,
      contentId: `seed/content-${number}.jpg`,
    };
  });
};

const login = async ({ page, baseUrl }) => {
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
    page.waitForURL(`${baseUrl}/screen/summary`, { timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ]);

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);
  expect(page.url()).toBe(`${baseUrl}/screen/summary`);
};

const prepareFavoriteAndQueue = async ({ page, mediaIds }) => {
  const responseStatuses = await page.evaluate(async ids => {
    const statuses = [];
    for (const mediaId of ids) {
      const favoriteResponse = await fetch(`/api/favorite/${mediaId}`, {
        method: 'PUT',
        headers: { Accept: 'application/json' },
      });
      statuses.push(favoriteResponse.status);

      const queueResponse = await fetch(`/api/queue/${mediaId}`, {
        method: 'PUT',
        headers: { Accept: 'application/json' },
      });
      statuses.push(queueResponse.status);
    }
    return statuses;
  }, mediaIds);

  expect(responseStatuses.every(status => status === 200)).toBe(true);
};

const readTitles = async currentPage => currentPage.evaluate(() => {
  return Array.from(document.querySelectorAll('.media-card h2'))
    .map(node => (node.textContent || '').trim())
    .filter(Boolean);
});

const readCurrentPage = async currentPage => currentPage.evaluate(() => {
  const node = document.querySelector('.page-current');
  return node ? Number.parseInt((node.textContent || '').trim(), 10) : null;
});

const clickPageLink = async ({ page, pageNumber }) => {
  await page.evaluate(number => {
    const link = Array.from(document.querySelectorAll('a.page-link')).find(candidate => {
      return (candidate.textContent || '').trim() === String(number);
    });
    if (!link) {
      throw new Error(`ページ ${number} のリンクが見つかりません`);
    }
    link.click();
  }, pageNumber);

  await page.waitForURL(url => url.searchParams.get('page') === String(pageNumber)
    || url.searchParams.get('queuePage') === String(pageNumber), { timeout: 30_000 });
};

test.describe('large e2e: favorite/queue の並び替えとページング', () => {
  const seedMedias = createSeedMedias(22);

  let app;
  let server;
  let baseUrl;
  let tempRootDirectory;
  let tempDatabasePath;
  let tempContentDirectory;

  test.beforeEach(async ({ page: currentPage }) => {
    page = currentPage;
    tempRootDirectory = await createE2eTempDirectory('mangaviewer-e2e-favorite-queue-');
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
      await Promise.all(seedMedias.map(media => app.locals.dependencies.mediaRepository.save(createSeedMedia(media))));
    });

    await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
    await Promise.all(seedMedias.map(media => fs.writeFile(path.join(tempContentDirectory, media.contentId), 'dummy', { encoding: 'utf8' })));

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

  test('favorite/queue のページングと並び替え、解除後の再計算が行える', async () => {
    const mediaIds = seedMedias.map(media => media.mediaId);

    await login({ page, baseUrl });
    await prepareFavoriteAndQueue({ page, mediaIds });

    await page.goto(`${baseUrl}/screen/favorite?page=1&sort=date_asc`, { waitUntil: 'networkidle' });

    const favoritePageText = await page.evaluate(() => document.body.innerText);
    expect(favoritePageText).toContain('22');
    expect(favoritePageText).toContain('ページ 1 / 2');

    const favoriteDateAscTitles = await readTitles(page);
    expect(favoriteDateAscTitles[0]).toBe('作品 01');

    await clickPageLink({ page, pageNumber: 2 });

    expect(await readCurrentPage(page)).toBe(2);
    expect(await page.$$eval('.media-card', cards => cards.length)).toBe(2);

    await page.goto(`${baseUrl}/screen/favorite?page=1&sort=title_desc`, { waitUntil: 'networkidle' });
    const favoriteTitleDescTitles = await readTitles(page);
    expect(favoriteTitleDescTitles[0]).toBe('作品 22');

    await page.goto(`${baseUrl}/screen/favorite?page=1&sort=title_asc`, { waitUntil: 'networkidle' });
    const favoriteTitleAscTitles = await readTitles(page);
    expect(favoriteTitleAscTitles[0]).toBe('作品 01');

    await page.goto(`${baseUrl}/screen/favorite?page=2&sort=date_asc`, { waitUntil: 'networkidle' });

    const favoriteDeleteResponsePromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: '/api/favorite/fq-media-22',
      method: 'DELETE',
    });
    await page.click('[data-media-id="fq-media-22"] .js-favorite-remove');
    const favoriteDeleteResponse = await favoriteDeleteResponsePromise;
    expect(favoriteDeleteResponse.status()).toBe(200);

    await page.goto(`${baseUrl}/screen/favorite?page=2&sort=date_asc`, { waitUntil: 'networkidle' });
    const favoriteAfterDeleteText = await page.evaluate(() => document.body.innerText);
    expect(favoriteAfterDeleteText).toContain('21');
    expect(favoriteAfterDeleteText).toContain('ページ 2 / 2');
    expect(await page.$$eval('.media-card', cards => cards.length)).toBe(1);

    await page.goto(`${baseUrl}/screen/queue?queuePage=1&sort=date_asc`, { waitUntil: 'networkidle' });

    const queuePageText = await page.evaluate(() => document.body.innerText);
    expect(queuePageText).toContain('22 件');
    expect(await readCurrentPage(page)).toBe(1);

    const queueDateAscTitles = await readTitles(page);
    expect(queueDateAscTitles[0]).toBe('作品 01');

    await clickPageLink({ page, pageNumber: 2 });

    expect(await readCurrentPage(page)).toBe(2);
    expect(await page.$$eval('.media-card', cards => cards.length)).toBe(2);

    await page.goto(`${baseUrl}/screen/queue?queuePage=1&sort=title_desc`, { waitUntil: 'networkidle' });
    const queueTitleDescTitles = await readTitles(page);
    expect(queueTitleDescTitles[0]).toBe('作品 22');

    await page.goto(`${baseUrl}/screen/queue?queuePage=1&sort=title_asc`, { waitUntil: 'networkidle' });
    const queueTitleAscTitles = await readTitles(page);
    expect(queueTitleAscTitles[0]).toBe('作品 01');

    await page.goto(`${baseUrl}/screen/queue?queuePage=2&sort=date_asc`, { waitUntil: 'networkidle' });

    const queueDeleteResponsePromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: '/api/queue/fq-media-22',
      method: 'DELETE',
    });
    await page.click('[data-media-id="fq-media-22"] .js-queue-toggle');
    const queueDeleteResponse = await queueDeleteResponsePromise;
    expect(queueDeleteResponse.status()).toBe(200);

    await page.goto(`${baseUrl}/screen/queue?queuePage=2&sort=date_asc`, { waitUntil: 'networkidle' });
    const queueAfterDeleteText = await page.evaluate(() => document.body.innerText);
    expect(queueAfterDeleteText).toContain('21 件');
    expect(await readCurrentPage(page)).toBe(2);
    expect(await page.$$eval('.media-card', cards => cards.length)).toBe(1);
  });
});
