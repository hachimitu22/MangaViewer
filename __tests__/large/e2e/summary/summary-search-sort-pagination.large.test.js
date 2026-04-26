const { test, expect } = require('@playwright/test');

const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { createSeedMedia } = require('../helpers/seedMedia');
const { readSummaryTitles } = require('../helpers/summaryDom');

let page;

test.describe('large e2e: summary 最小回帰', () => {
  let appContext;

  test.beforeEach(async ({ page: currentPage }) => {
    page = currentPage;
    appContext = await bootstrapE2eApp({
      prefix: 'mangaviewer-summary-regression-e2e-',
      seed: async ({ app, tempContentDirectory, fs, path }) => {
        const medias = [
          createSeedMedia({
            mediaId: 'media-1',
            title: 'Alpha target',
            contentId: 'seed/content-1.jpg',
            tags: [
              { category: 'シリーズ', label: '対象' },
              { category: 'ジャンル', label: '少年' },
            ],
            registeredAt: new Date('2024-01-01T00:00:00.000Z'),
          }),
          createSeedMedia({
            mediaId: 'media-2',
            title: 'Gamma target',
            contentId: 'seed/content-2.jpg',
            tags: [{ category: 'シリーズ', label: '対象' }],
            registeredAt: new Date('2024-01-02T00:00:00.000Z'),
          }),
          createSeedMedia({
            mediaId: 'media-3',
            title: 'No hit item',
            contentId: 'seed/content-3.jpg',
            tags: [{ category: 'ジャンル', label: '一般' }],
            registeredAt: new Date('2024-01-03T00:00:00.000Z'),
          }),
        ];

        await app.locals.dependencies.unitOfWork.run(async () => {
          await Promise.all(medias.map(media => app.locals.dependencies.mediaRepository.save(media)));
        });

        await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
        await Promise.all([
          fs.writeFile(path.join(tempContentDirectory, 'seed', 'content-1.jpg'), 'dummy-1', { encoding: 'utf8' }),
          fs.writeFile(path.join(tempContentDirectory, 'seed', 'content-2.jpg'), 'dummy-2', { encoding: 'utf8' }),
          fs.writeFile(path.join(tempContentDirectory, 'seed', 'content-3.jpg'), 'dummy-3', { encoding: 'utf8' }),
        ]);
      },
    });
  });

  test.afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }
    appContext = null;
  });

  test('検索条件つき summary を表示し、詳細リンクが機能する', async () => {
    const { baseUrl } = appContext;
    await page.goto(
      `${baseUrl}/screen/summary?summaryPage=1&size=2&sort=title_asc&title=target&tags=${encodeURIComponent('シリーズ:対象')}`,
      { waitUntil: 'networkidle' },
    );

    await page.waitForSelector('.media-card h2');

    const titles = await readSummaryTitles(page);
    expect(titles).toEqual(['Alpha target', 'Gamma target']);

    const firstDetailHref = await page.$eval('.media-card .actions a', link => link.getAttribute('href'));
    expect(firstDetailHref).toBe('/screen/detail/media-1');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('.media-card .actions a'),
    ]);

    expect(page.url()).toBe(`${baseUrl}/screen/detail/media-1`);
    await expect(page.locator('main')).toContainText('Alpha target');
  });
});
