const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { createSeedMedia } = require('../helpers/seedMedia');

describe('large e2e: ログイン画面からサマリー画面まで遷移する', () => {
  const seedTitle = 'seed済みタイトル';

  let appContext;

  beforeEach(async () => {
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

  afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }

    appContext = null;
  });

  test('ログイン成功後に /screen/summary へ遷移して seed データが表示される', async () => {
    const { baseUrl } = appContext;

    await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle0' });

    await page.type('#username', 'admin');
    await page.type('#password', 'admin');

    const loginResponsePromise = page.waitForResponse(response => {
      return response.url() === `${baseUrl}/api/login` && response.request().method() === 'POST';
    });

    await page.click('button[type="submit"]');

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);
    await expect(loginResponse.json()).resolves.toMatchObject({ code: 0 });

    await page.waitForNavigation({
      waitUntil: 'networkidle0',
    });
    expect(page.url()).toBe(`${baseUrl}/screen/summary`);

    await page.waitForFunction(
      expectedTitle => document.body && document.body.innerText.includes(expectedTitle),
      {},
      seedTitle,
    );

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain(seedTitle);
  });
});
