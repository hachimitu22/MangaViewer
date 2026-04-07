const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { createSeedMedia } = require('../helpers/seedMedia');
const { test, expect } = require('@playwright/test');

let page;

test.describe('large e2e: ログイン画面からサマリー画面まで遷移する', () => {
  const seedTitle = 'seed済みタイトル';

  let appContext;

  test.beforeEach(async ({ page: currentPage }) => {
    page = currentPage;
    appContext = await bootstrapE2eApp({
      seed: async ({ app, tempContentDirectory, fs, path }) => {
        await app.locals.dependencies.unitOfWork.run(async () => {
          await app.locals.dependencies.mediaRepository.save(createSeedMedia({
            mediaId: 'media-seed-1',
            title: seedTitle,
            contentId: 'seed/content-1.jpg',
          }));
        });

        await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
        await fs.writeFile(path.join(tempContentDirectory, 'seed', 'content-1.jpg'), 'dummy', { encoding: 'utf8' });
      },
    });
  });

  test.afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }

    appContext = null;
  });

  test('ログイン成功後に /screen/summary へ遷移して seed データが表示される', async () => {
    const { baseUrl } = appContext;

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
    await expect(page.locator('body')).toContainText(seedTitle);
  });

  test('認証成功だけを連続して実行しても /api/login が 429 を返さない', async () => {
    const { baseUrl } = appContext;

    for (let i = 0; i < 8; i += 1) {
      const response = await page.request.post(`${baseUrl}/api/login`, {
        form: {
          username: 'admin',
          password: 'admin',
        },
      });

      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual({ code: 0 });
    }
  });
});
