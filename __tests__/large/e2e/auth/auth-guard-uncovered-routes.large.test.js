const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { createSeedMedia } = require('../helpers/seedMedia');
const { test, expect } = require('@playwright/test');

let page;

const login = async ({ baseUrl }) => {
  await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle' });
  await page.type('#username', 'admin');
  await page.type('#password', 'admin');

  const loginResponsePromise = page.waitForResponse(response => {
    return response.url() === `${baseUrl}/api/login` && response.request().method() === 'POST';
  });

  await page.click('button[type="submit"]');

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);

  await page.waitForNavigation({ waitUntil: 'networkidle' });
  expect(page.url()).toBe(`${baseUrl}/screen/summary`);
};

const expectUnauthorizedJsonResponse = async response => {
  expect(response).not.toBeNull();
  expect(response.status()).toBe(401);
};

test.describe('large e2e: 認可境界（未カバー導線）', () => {
  const detailMediaId = 'auth-uncovered-media-1';
  const contentIdForViewer = 'seed/auth-uncovered-content-1.jpg';
  const contentIdForPost = '11111111111111111111111111111111';

  let appContext;

  test.beforeEach(async ({ page: currentPage }) => {
    page = currentPage;
    appContext = await bootstrapE2eApp({
      prefix: 'mangaviewer-e2e-auth-guard-uncovered-',
      seed: async ({ app, tempContentDirectory, fs, path }) => {
        await app.locals.dependencies.unitOfWork.run(async () => {
          await app.locals.dependencies.mediaRepository.save(createSeedMedia({
            mediaId: detailMediaId,
            title: '認可境界未カバー導線検証',
            contentId: contentIdForViewer,
          }));
        });

        await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
        await fs.writeFile(path.join(tempContentDirectory, contentIdForViewer), 'dummy', { encoding: 'utf8' });

        const postContentDirectory = path.join(tempContentDirectory, '11', '11', '11', '11');
        await fs.mkdir(postContentDirectory, { recursive: true });
        await fs.writeFile(path.join(postContentDirectory, contentIdForPost), 'dummy', { encoding: 'utf8' });
      },
    });
  });

  test.afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }
    appContext = null;
  });

  test('未ログイン時は未カバー画面導線も保護され、ログイン後は表示可能になる', async () => {
    const { baseUrl } = appContext;

    const protectedPaths = [
      `/screen/viewer/${detailMediaId}/1`,
      '/screen/search',
    ];

    for (const protectedPath of protectedPaths) {
      const response = await page.goto(`${baseUrl}${protectedPath}`, { waitUntil: 'networkidle' });
      await expectUnauthorizedJsonResponse(response);
    }

    await login({ baseUrl });

    for (const protectedPath of protectedPaths) {
      const response = await page.goto(`${baseUrl}${protectedPath}`, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
    }

    await page.goto(`${baseUrl}/screen/viewer/${detailMediaId}/1`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.stage img');

    const viewerImageSource = await page.$eval('.stage img', element => element.getAttribute('src'));
    expect(viewerImageSource).toBe(contentIdForViewer);

    await page.goto(`${baseUrl}/screen/search`, { waitUntil: 'networkidle' });
    await page.waitForSelector('form');
  });

  test('未ログインでは未カバー保護 API が 401 になり、ログイン後は同一 API が許可される', async () => {
    const { baseUrl } = appContext;

    const unauthorizedResults = await page.evaluate(async ({ mediaId, postContentId }) => {
      const postFormData = new FormData();
      postFormData.append('title', '未ログイン投稿');
      postFormData.append('tags[0][category]', 'カテゴリ');
      postFormData.append('tags[0][label]', 'ラベル');
      postFormData.append('contents[0][position]', '1');
      postFormData.append('contents[0][id]', postContentId);

      const [createMedia, logout, deleteFavorite, deleteQueue] = await Promise.all([
        fetch('/api/media', { method: 'POST', body: postFormData }),
        fetch('/api/logout', { method: 'POST', headers: { Accept: 'application/json' } }),
        fetch(`/api/favorite/${mediaId}`, { method: 'DELETE', headers: { Accept: 'application/json' } }),
        fetch(`/api/queue/${mediaId}`, { method: 'DELETE', headers: { Accept: 'application/json' } }),
      ]);

      return Promise.all([createMedia, logout, deleteFavorite, deleteQueue].map(async response => {
        return {
          status: response.status,
          body: await response.json(),
        };
      }));
    }, { mediaId: detailMediaId, postContentId: contentIdForPost });

    unauthorizedResults.forEach(result => {
      expect(result.status).toBe(401);
      expect(result.body).toEqual({ message: '認証に失敗しました' });
    });

    await login({ baseUrl });

    const authorizedResults = await page.evaluate(async ({ mediaId, postContentId }) => {
      const postFormData = new FormData();
      postFormData.append('title', 'ログイン後投稿');
      postFormData.append('tags[0][category]', 'カテゴリ');
      postFormData.append('tags[0][label]', '許可確認');
      postFormData.append('contents[0][position]', '1');
      postFormData.append('contents[0][id]', postContentId);

      const createMedia = await fetch('/api/media', {
        method: 'POST',
        body: postFormData,
      });
      const logout = await fetch('/api/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const deleteFavorite = await fetch(`/api/favorite/${mediaId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      const deleteQueue = await fetch(`/api/queue/${mediaId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });

      return Promise.all([createMedia, logout, deleteFavorite, deleteQueue].map(async response => {
        return {
          status: response.status,
          body: await response.json(),
        };
      }));
    }, { mediaId: detailMediaId, postContentId: contentIdForPost });

    authorizedResults.forEach(result => {
      expect(result.status).toBe(200);
      expect(result.body).toEqual({ code: 0 });
    });
  });
});
