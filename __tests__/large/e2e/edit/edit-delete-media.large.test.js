const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { createSeedMedia } = require('../helpers/seedMedia');

const login = async baseUrl => {
  await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle0' });

  await page.type('#username', 'admin');
  await page.type('#password', 'admin');

  const loginResponsePromise = page.waitForResponse(response => {
    return response.url() === `${baseUrl}/api/login` && response.request().method() === 'POST';
  });

  await page.click('button[type="submit"]');

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);

  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  expect(page.url()).toBe(`${baseUrl}/screen/summary`);
};

const expectErrorScreen = async ({ baseUrl, path }) => {
  const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle0' });

  expect([200, 304]).toContain(response.status());
  expect(page.url()).toBe(`${baseUrl}/screen/error`);

  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText).toContain('ページを表示できませんでした');
  expect(bodyText).toContain('ログイン画面へ戻る');
  expect(bodyText).toContain('一覧・サマリー画面へ戻る');
};

describe('large e2e: 編集画面でメディア削除後に各画面から到達不能になることを確認する', () => {
  const seedMediaId = 'dddddddddddddddddddddddddddddddd';
  const seedTitle = '削除対象の seed メディア';

  let appContext;

  beforeEach(async () => {
    appContext = await bootstrapE2eApp({
      prefix: 'mangaviewer-e2e-edit-delete-',
      seed: async ({ app, tempContentDirectory, fs, path }) => {
        await app.locals.dependencies.unitOfWork.run(async () => {
          await app.locals.dependencies.mediaRepository.save(createSeedMedia({
            mediaId: seedMediaId,
            title: seedTitle,
            contentId: 'seed/edit-delete-content-1.jpg',
          }));
        });

        await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
        await fs.writeFile(path.join(tempContentDirectory, 'seed', 'edit-delete-content-1.jpg'), 'dummy', { encoding: 'utf8' });
      },
    });
  });

  afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }

    appContext = null;
  });

  test('編集画面の削除成功後に summary からカードが消え、detail/viewer 直接アクセスでエラー画面へ遷移する', async () => {
    const { baseUrl } = appContext;

    await login(baseUrl);

    await page.goto(`${baseUrl}/screen/edit/${seedMediaId}`, { waitUntil: 'networkidle0' });

    const deleteResponsePromise = page.waitForResponse(response => {
      return response.url() === `${baseUrl}/api/media/${seedMediaId}` && response.request().method() === 'DELETE';
    });

    const dialogPromise = new Promise(resolve => {
      page.once('dialog', async dialog => {
        await dialog.accept();
        resolve();
      });
    });

    const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.click('#delete-button');

    await dialogPromise;

    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(200);

    await navigationPromise;
    expect(page.url()).toBe(`${baseUrl}/screen/summary`);

    const deletedCard = await page.$(`[data-media-id="${seedMediaId}"]`);
    expect(deletedCard).toBeNull();

    await expectErrorScreen({
      baseUrl,
      path: `/screen/detail/${seedMediaId}`,
    });

    await expectErrorScreen({
      baseUrl,
      path: `/screen/viewer/${seedMediaId}/1`,
    });
  });
});
