const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { createSeedMedia } = require('../helpers/seedMedia');
const { test, expect } = require('@playwright/test');

let page;

const login = async baseUrl => {
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

const expectErrorScreen = async ({ baseUrl, path }) => {
  const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });

  expect(response.status()).toBe(200);
  expect(page.url()).toBe(`${baseUrl}/screen/error`);

  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText).toContain('ページを表示できませんでした');
  expect(bodyText).toContain('ログイン画面へ戻る');
  expect(bodyText).toContain('一覧・サマリー画面へ戻る');
};

test.describe('large e2e: 不正な route params でエラー画面へ遷移し安全に復帰できる', () => {
  const seedMediaId = 'media-invalid-route-seed';
  const seedTitle = '不正ルート復帰確認タイトル';

  let appContext;

  test.beforeEach(async ({ page: currentPage }) => {
    page = currentPage;
    appContext = await bootstrapE2eApp({
      prefix: 'mangaviewer-e2e-invalid-route-',
      seed: async ({ app, tempContentDirectory, fs, path }) => {
        await app.locals.dependencies.unitOfWork.run(async () => {
          await app.locals.dependencies.mediaRepository.save(createSeedMedia({
            mediaId: seedMediaId,
            title: seedTitle,
            contentId: 'seed/invalid-route-content-1.jpg',
          }));
        });

        await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
        await fs.writeFile(path.join(tempContentDirectory, 'seed', 'invalid-route-content-1.jpg'), 'dummy', { encoding: 'utf8' });
      },
    });
  });

  test.afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }

    appContext = null;
  });

  test('存在しない mediaId と不正 page 指定時にエラー画面へ遷移し、一覧へ復帰できる', async () => {
    const { baseUrl } = appContext;

    await login(baseUrl);

    await expectErrorScreen({
      baseUrl,
      path: '/screen/detail/media-not-exists-for-e2e',
    });

    await expectErrorScreen({
      baseUrl,
      path: '/screen/viewer/media-not-exists-for-e2e/1',
    });

    await expectErrorScreen({
      baseUrl,
      path: `/screen/viewer/${seedMediaId}/0`,
    });

    await expectErrorScreen({
      baseUrl,
      path: `/screen/viewer/${seedMediaId}/9999`,
    });

    const currentResponse = await page.goto(page.url(), { waitUntil: 'networkidle' });
    expect(currentResponse.status()).toBe(200);

    await Promise.all([
      page.waitForURL(url => url.pathname === '/screen/summary', { timeout: 30_000 }),
      page.click('a[href="/screen/summary"]'),
    ]);

    expect(page.url()).toMatch(new RegExp(`^${baseUrl}/screen/summary(\\?.*)?$`));

    const summaryBodyText = await page.evaluate(() => document.body.innerText);
    expect(summaryBodyText).toContain('メディア一覧');

    const notFoundApiResponse = await page.evaluate(async () => {
      const response = await fetch('/screen/not-defined-path-for-e2e', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      return {
        status: response.status,
        body: await response.json(),
      };
    });

    expect(notFoundApiResponse.status).toBe(404);
    expect(notFoundApiResponse.body).toEqual({ message: 'Not Found' });
  });
});
