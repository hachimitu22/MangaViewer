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

  await Promise.all([
    page.waitForURL(`${baseUrl}/screen/summary`, { timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ]);

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);
  expect(page.url()).toBe(`${baseUrl}/screen/summary`);
};

const expectUnauthorizedJsonResponse = async response => {
  expect(response).not.toBeNull();
  expect(response.status()).toBe(401);
};

const toExpectedPublicPath = contentId => {
  return `/contents/${contentId.slice(0, 2)}/${contentId.slice(2, 4)}/${contentId.slice(4, 6)}/${contentId.slice(6, 8)}/${contentId}`;
};

test.describe('large e2e: 認可境界（未カバー導線）', () => {
  const detailMediaId = 'auth-uncovered-media-1';
  const contentIdForViewer = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
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

        const viewerDirectory = path.join(
          tempContentDirectory,
          contentIdForViewer.slice(0, 2),
          contentIdForViewer.slice(2, 4),
          contentIdForViewer.slice(4, 6),
          contentIdForViewer.slice(6, 8),
        );
        await fs.mkdir(viewerDirectory, { recursive: true });
        await fs.writeFile(path.join(viewerDirectory, contentIdForViewer), 'dummy', { encoding: 'utf8' });

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
    expect(viewerImageSource).toBe(toExpectedPublicPath(contentIdForViewer));

    await page.goto(`${baseUrl}/screen/search`, { waitUntil: 'networkidle' });
    await page.waitForSelector('form');
  });

  test('未ログインでは未カバー保護 API が 401 になり、ログイン後は同一 API が許可される', async () => {
    const { baseUrl } = appContext;
    await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle' });

    const unauthorizedResults = await page.evaluate(async ({ mediaId, postContentId, baseUrl }) => {
      const postFormData = new FormData();
      postFormData.append('title', '未ログイン投稿');
      postFormData.append('tags[0][category]', 'カテゴリ');
      postFormData.append('tags[0][label]', 'ラベル');
      postFormData.append('contents[0][position]', '1');
      postFormData.append('contents[0][id]', postContentId);

      const [createMedia, logout, deleteFavorite, deleteQueue] = await Promise.all([
        fetch(`${baseUrl}/api/media`, { method: 'POST', body: postFormData }),
        fetch(`${baseUrl}/api/logout`, { method: 'POST', headers: { Accept: 'application/json' } }),
        fetch(`${baseUrl}/api/favorite/${mediaId}`, { method: 'DELETE', headers: { Accept: 'application/json' } }),
        fetch(`${baseUrl}/api/queue/${mediaId}`, { method: 'DELETE', headers: { Accept: 'application/json' } }),
      ]);

      return Promise.all([createMedia, logout, deleteFavorite, deleteQueue].map(async response => {
        return {
          status: response.status,
          body: await response.json(),
        };
      }));
    }, { mediaId: detailMediaId, postContentId: contentIdForPost, baseUrl });

    unauthorizedResults.forEach(result => {
      expect(result.status).toBe(401);
      expect(result.body).toEqual({ message: '認証に失敗しました' });
    });

    await login({ baseUrl });

    const authorizedResults = await page.evaluate(async ({ mediaId, postContentId, baseUrl }) => {
      const csrfToken = window.__csrfToken || '';
      const postFormData = new FormData();
      postFormData.append('title', 'ログイン後投稿');
      postFormData.append('tags[0][category]', 'カテゴリ');
      postFormData.append('tags[0][label]', '許可確認');
      postFormData.append('contents[0][position]', '1');
      postFormData.append('contents[0][id]', postContentId);

      const createMedia = await fetch(`${baseUrl}/api/media`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body: postFormData,
      });
      const deleteFavorite = await fetch(`${baseUrl}/api/favorite/${mediaId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'X-CSRF-Token': csrfToken },
      });
      const deleteQueue = await fetch(`${baseUrl}/api/queue/${mediaId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'X-CSRF-Token': csrfToken },
      });
      const logout = await fetch(`${baseUrl}/api/logout`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-CSRF-Token': csrfToken },
      });

      return Promise.all([createMedia, deleteFavorite, deleteQueue, logout].map(async response => {
        return {
          status: response.status,
          body: await response.json(),
        };
      }));
    }, { mediaId: detailMediaId, postContentId: contentIdForPost, baseUrl });

    expect(authorizedResults[0].status).toBe(200);
    expect(authorizedResults[0].body).toMatchObject({
      code: 0,
      mediaId: expect.stringMatching(/^[0-9a-f]{32}$/),
    });

    authorizedResults.slice(1, 3).forEach(result => {
      expect(result.status).toBe(200);
      expect([0, 1]).toContain(result.body.code);
    });

    expect(authorizedResults[3].status).toBe(200);
    expect(authorizedResults[3].body).toEqual({ code: 0 });
  });
});
