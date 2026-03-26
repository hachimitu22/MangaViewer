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
  await expect(loginResponse.json()).resolves.toEqual({ code: 0 });

  await page.waitForNavigation({ waitUntil: 'networkidle' });
  expect(page.url()).toBe(`${baseUrl}/screen/summary`);
};

const expectUnauthorizedJsonResponse = async response => {
  expect(response).not.toBeNull();
  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({ message: '認証に失敗しました' });
};

test.describe('large e2e: 認可境界（画面ガードと保護 API）', () => {
  const detailMediaId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const deleteMediaId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const existingContentId = 'seed/auth-content-1.jpg';

  let appContext;

  test.beforeEach(async ({ page: currentPage }) => {
    page = currentPage;
    appContext = await bootstrapE2eApp({
      prefix: 'mangaviewer-e2e-auth-guard-',
      seed: async ({ app, tempContentDirectory, fs, path }) => {
        await app.locals.dependencies.unitOfWork.run(async () => {
          await app.locals.dependencies.mediaRepository.save(createSeedMedia({
            mediaId: detailMediaId,
            title: '認可境界検証（詳細）',
            contentId: existingContentId,
          }));
          await app.locals.dependencies.mediaRepository.save(createSeedMedia({
            mediaId: deleteMediaId,
            title: '認可境界検証（削除）',
            contentId: 'seed/auth-content-2.jpg',
          }));
        });

        await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
        await fs.writeFile(path.join(tempContentDirectory, 'seed', 'auth-content-1.jpg'), 'dummy', { encoding: 'utf8' });
        await fs.writeFile(path.join(tempContentDirectory, 'seed', 'auth-content-2.jpg'), 'dummy', { encoding: 'utf8' });
      },
    });
  });

  test.afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }
    appContext = null;
  });

  test('未ログインで保護画面へ直接アクセスすると統一的に 401 認証エラーとなる', async () => {
    const { baseUrl } = appContext;
    const protectedPaths = [
      '/screen/summary',
      `/screen/detail/${detailMediaId}`,
      '/screen/favorite',
      '/screen/queue',
      '/screen/entry',
      `/screen/edit/${detailMediaId}`,
    ];

    for (const path of protectedPaths) {
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
      // 既存仕様では未認証アクセス時はログイン画面遷移ではなく JSON 401 を返す。
      await expectUnauthorizedJsonResponse(response);
    }
  });

  test('未ログインでは保護 API が拒否され、ログイン後は同一操作が許可される', async () => {
    const { baseUrl } = appContext;

    const unauthorizedResult = await page.evaluate(async ({ mediaId, targetDeleteMediaId }) => {
      const patchFormData = new FormData();
      patchFormData.append('title', '未ログイン更新');
      patchFormData.append('tags[0][category]', 'カテゴリ');
      patchFormData.append('tags[0][label]', 'ラベル');
      patchFormData.append('contents[0][position]', '1');
      patchFormData.append('contents[0][id]', 'seed/auth-content-1.jpg');

      const [favorite, queue, patch, remove] = await Promise.all([
        fetch(`/api/favorite/${mediaId}`, { method: 'PUT', headers: { Accept: 'application/json' } }),
        fetch(`/api/queue/${mediaId}`, { method: 'PUT', headers: { Accept: 'application/json' } }),
        fetch(`/api/media/${mediaId}`, { method: 'PATCH', body: patchFormData }),
        fetch(`/api/media/${targetDeleteMediaId}`, { method: 'DELETE', headers: { Accept: 'application/json' } }),
      ]);

      return Promise.all([favorite, queue, patch, remove].map(async response => {
        return {
          status: response.status,
          body: await response.json(),
        };
      }));
    }, { mediaId: detailMediaId, targetDeleteMediaId: deleteMediaId });

    unauthorizedResult.forEach(result => {
      expect(result.status).toBe(401);
      expect(result.body).toEqual({ message: '認証に失敗しました' });
    });

    await login({ baseUrl });

    const authorizedResult = await page.evaluate(async ({ mediaId, targetDeleteMediaId }) => {
      const patchFormData = new FormData();
      patchFormData.append('title', 'ログイン後更新済み');
      patchFormData.append('tags[0][category]', 'カテゴリ');
      patchFormData.append('tags[0][label]', '更新ラベル');
      patchFormData.append('contents[0][position]', '1');
      patchFormData.append('contents[0][id]', 'seed/auth-content-1.jpg');

      const favorite = await fetch(`/api/favorite/${mediaId}`, {
        method: 'PUT',
        headers: { Accept: 'application/json' },
      });
      const queue = await fetch(`/api/queue/${mediaId}`, {
        method: 'PUT',
        headers: { Accept: 'application/json' },
      });
      const patch = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        body: patchFormData,
      });
      const remove = await fetch(`/api/media/${targetDeleteMediaId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });

      return Promise.all([favorite, queue, patch, remove].map(async response => {
        return {
          status: response.status,
          body: await response.json(),
        };
      }));
    }, { mediaId: detailMediaId, targetDeleteMediaId: deleteMediaId });

    authorizedResult.forEach(result => {
      expect(result.status).toBe(200);
      expect(result.body).toEqual({ code: 0 });
    });

    const protectedPaths = [
      '/screen/summary',
      `/screen/detail/${detailMediaId}`,
      '/screen/favorite',
      '/screen/queue',
      '/screen/entry',
      `/screen/edit/${detailMediaId}`,
    ];

    for (const path of protectedPaths) {
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
    }
  });
});
