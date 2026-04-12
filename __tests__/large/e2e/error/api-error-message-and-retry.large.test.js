const path = require('path');
const { test, expect } = require('@playwright/test');

const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { waitForApiResponse } = require('../support/api-response');
const { seedSingleMedia } = require('../helpers/seedMedia');

const seedMediaId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const seedTitle = 'APIエラー再操作テスト用タイトル';

const loginAsAdmin = async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle' });
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin');

  await Promise.all([
    page.waitForURL(`${baseUrl}/screen/summary`, { waitUntil: 'networkidle' }),
    page.click('button[type="submit"]'),
  ]);
};

const mockApiError = async ({ page, baseUrl, pathSuffix, method = 'POST', status = 500, message = 'Internal Server Error' }) => {
  const targetUrl = `${baseUrl}${pathSuffix}`;
  await page.route(targetUrl, async route => {
    const request = route.request();
    if (request.method() !== method) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message }),
    });
  });
};

test.describe('large e2e: API異常時の画面内エラーメッセージと再操作導線', () => {
  let appContext;

  test.beforeEach(async ({ page }) => {
    appContext = await bootstrapE2eApp({
      prefix: 'mangaviewer-e2e-error-message-retry-',
      seed: async ({ app, tempContentDirectory }) => {
        await seedSingleMedia({
          app,
          mediaId: seedMediaId,
          title: seedTitle,
          contentIds: ['seed/retry-content-1.jpg'],
        });
        await require('fs/promises').mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
        await require('fs/promises').writeFile(
          path.join(tempContentDirectory, 'seed', 'retry-content-1.jpg'),
          'dummy',
          { encoding: 'utf8' },
        );
      },
    });

    await loginAsAdmin({ page, baseUrl: appContext.baseUrl });
  });

  test.afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }
    appContext = null;
  });

  test('登録画面: POST /api/media の失敗時に画面内メッセージを表示して再操作できる', async ({ page }) => {
    const { baseUrl } = appContext;
    await page.goto(`${baseUrl}/screen/entry`, { waitUntil: 'networkidle' });

    await mockApiError({
      page,
      baseUrl,
      pathSuffix: '/api/media',
      method: 'POST',
      status: 500,
      message: 'Internal Server Error',
    });

    await page.fill('#title', '失敗テストタイトル');
    await page.fill('#category-input', '作者');
    await page.fill('#tag-input', '失敗タグ');
    await page.click('#add-tag-button');
    await page.setInputFiles('#file-input', {
      name: 'failed-entry.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('dummy-image'),
    });

    const responsePromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: '/api/media',
      method: 'POST',
    });

    await page.click('#entry-form button[type="submit"]');
    const response = await responsePromise;
    expect(response.status()).toBe(500);

    await expect(page).toHaveURL(`${baseUrl}/screen/entry`);
    await expect(page.locator('#form-message')).toContainText('Internal Server Error');
    await expect(page.locator('#title')).toBeEnabled();
  });

  test('編集画面: PATCH/DELETE /api/media/{mediaId} の失敗時に画面内メッセージを表示する', async ({ page }) => {
    const { baseUrl } = appContext;
    await page.goto(`${baseUrl}/screen/edit/${seedMediaId}`, { waitUntil: 'networkidle' });

    await mockApiError({
      page,
      baseUrl,
      pathSuffix: `/api/media/${seedMediaId}`,
      method: 'PATCH',
      status: 500,
      message: 'Internal Server Error',
    });

    const patchResponsePromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/media/${seedMediaId}`,
      method: 'PATCH',
    });
    await page.click('#edit-form button[type="submit"]');
    const patchResponse = await patchResponsePromise;
    expect(patchResponse.status()).toBe(500);

    await expect(page).toHaveURL(`${baseUrl}/screen/edit/${seedMediaId}`);
    await expect(page.locator('#form-message')).toContainText('Internal Server Error');

    await page.unroute(`${baseUrl}/api/media/${seedMediaId}`);
    await mockApiError({
      page,
      baseUrl,
      pathSuffix: `/api/media/${seedMediaId}`,
      method: 'DELETE',
      status: 500,
      message: 'Internal Server Error',
    });

    page.once('dialog', dialog => dialog.accept());

    const deleteResponsePromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/media/${seedMediaId}`,
      method: 'DELETE',
    });
    await page.click('#delete-button');
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(500);

    await expect(page).toHaveURL(`${baseUrl}/screen/edit/${seedMediaId}`);
    await expect(page.locator('#form-message')).toContainText('Internal Server Error');
  });

  test('詳細/お気に入り/あとで見る画面: favorite/queue API 失敗時に同一画面で再操作できる', async ({ page }) => {
    const { baseUrl } = appContext;

    await page.goto(`${baseUrl}/screen/detail/${seedMediaId}`, { waitUntil: 'networkidle' });
    await mockApiError({
      page,
      baseUrl,
      pathSuffix: `/api/favorite/${seedMediaId}`,
      method: 'PUT',
      status: 500,
      message: 'Internal Server Error',
    });

    const detailFavoriteFailPromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/favorite/${seedMediaId}`,
      method: 'PUT',
    });
    await page.click('#favorite-add');
    const detailFavoriteFail = await detailFavoriteFailPromise;
    expect(detailFavoriteFail.status()).toBe(500);
    await expect(page).toHaveURL(`${baseUrl}/screen/detail/${seedMediaId}`);
    await expect(page.locator('#request-status')).toContainText('失敗');

    await page.unroute(`${baseUrl}/api/favorite/${seedMediaId}`);

    const addFavoriteSuccessPromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/favorite/${seedMediaId}`,
      method: 'PUT',
    });
    await page.click('#favorite-add');
    const addFavoriteSuccess = await addFavoriteSuccessPromise;
    expect(addFavoriteSuccess.status()).toBe(200);

    const addQueueSuccessPromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/queue/${seedMediaId}`,
      method: 'PUT',
    });
    await page.click('#queue-add');
    const addQueueSuccess = await addQueueSuccessPromise;
    expect(addQueueSuccess.status()).toBe(200);

    await page.goto(`${baseUrl}/screen/favorite`, { waitUntil: 'networkidle' });
    await mockApiError({
      page,
      baseUrl,
      pathSuffix: `/api/favorite/${seedMediaId}`,
      method: 'DELETE',
      status: 500,
      message: 'Internal Server Error',
    });

    const favoriteDeleteFailPromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/favorite/${seedMediaId}`,
      method: 'DELETE',
    });
    await page.click(`[data-media-id="${seedMediaId}"] .js-favorite-remove`);
    const favoriteDeleteFail = await favoriteDeleteFailPromise;
    expect(favoriteDeleteFail.status()).toBe(500);
    await expect(page).toHaveURL(`${baseUrl}/screen/favorite`);
    await expect(page.locator(`[data-media-id="${seedMediaId}"] .status`)).toContainText('失敗');
    await expect(page.locator(`[data-media-id="${seedMediaId}"]`)).toBeVisible();

    await page.unroute(`${baseUrl}/api/favorite/${seedMediaId}`);

    await page.goto(`${baseUrl}/screen/queue`, { waitUntil: 'networkidle' });
    await mockApiError({
      page,
      baseUrl,
      pathSuffix: `/api/queue/${seedMediaId}`,
      method: 'DELETE',
      status: 500,
      message: 'Internal Server Error',
    });

    const queueDeleteFailPromise = waitForApiResponse({
      pageInstance: page,
      baseUrl,
      pathSuffix: `/api/queue/${seedMediaId}`,
      method: 'DELETE',
    });
    await page.click(`[data-media-id="${seedMediaId}"] .js-queue-toggle`);
    const queueDeleteFail = await queueDeleteFailPromise;
    expect(queueDeleteFail.status()).toBe(500);
    await expect(page).toHaveURL(`${baseUrl}/screen/queue`);
    await expect(page.locator(`[data-media-id="${seedMediaId}"] .status`)).toContainText('失敗');
    await expect(page.locator(`[data-media-id="${seedMediaId}"]`)).toBeVisible();
  });

  test('ナビゲーター: POST /api/logout 失敗時に画面内メッセージを表示して操作継続できる', async ({ page }) => {
    const { baseUrl } = appContext;
    await page.goto(`${baseUrl}/screen/summary`, { waitUntil: 'networkidle' });

    await mockApiError({
      page,
      baseUrl,
      pathSuffix: '/api/logout',
      method: 'POST',
      status: 500,
      message: 'Internal Server Error',
    });

    await page.click('#common-nav-logout');
    await expect(page).toHaveURL(`${baseUrl}/screen/summary`);
    await expect(page.locator('#common-nav-logout-status')).toContainText('失敗');
  });
});
