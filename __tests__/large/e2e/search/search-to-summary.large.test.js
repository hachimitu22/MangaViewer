const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { createSeedMedia } = require('../helpers/seedMedia');

describe('large e2e: search から summary への条件引き継ぎ', () => {
  let appContext;

  beforeEach(async () => {
    appContext = await bootstrapE2eApp({
      prefix: 'mangaviewer-search-to-summary-e2e-',
      seed: async ({ app, tempContentDirectory, fs, path }) => {
        const medias = [
          createSeedMedia({
            mediaId: 'media-1',
            title: 'target newest',
            contentId: 'seed/content-1.jpg',
            tags: [
              { category: 'シリーズ', label: '対象' },
              { category: 'ジャンル', label: '少年' },
            ],
            registeredAt: new Date('2024-02-01T00:00:00.000Z'),
          }),
          createSeedMedia({
            mediaId: 'media-2',
            title: 'target old',
            contentId: 'seed/content-2.jpg',
            tags: [
              { category: 'シリーズ', label: '対象' },
              { category: 'ジャンル', label: '青年' },
            ],
            registeredAt: new Date('2024-01-01T00:00:00.000Z'),
          }),
          createSeedMedia({
            mediaId: 'media-3',
            title: 'other newest',
            contentId: 'seed/content-3.jpg',
            tags: [
              { category: 'シリーズ', label: '別作品' },
              { category: 'ジャンル', label: '少年' },
            ],
            registeredAt: new Date('2024-03-01T00:00:00.000Z'),
          }),
          createSeedMedia({
            mediaId: 'media-4',
            title: 'misc',
            contentId: 'seed/content-4.jpg',
            tags: [{ category: 'ジャンル', label: '一般' }],
            registeredAt: new Date('2024-01-15T00:00:00.000Z'),
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
          fs.writeFile(path.join(tempContentDirectory, 'seed', 'content-4.jpg'), 'dummy-4', { encoding: 'utf8' }),
        ]);
      },
    });
  });

  afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }

    appContext = null;
  });

  test('/screen/search で入力した条件を /screen/summary で URL と表示に引き継ぐ', async () => {
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

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toBe(`${baseUrl}/screen/summary`);

    await page.goto(`${baseUrl}/screen/search`, { waitUntil: 'networkidle0' });

    await page.type('#title', 'target');
    await page.click('#start', { clickCount: 3 });
    await page.type('#start', '1');
    await page.click('#size', { clickCount: 3 });
    await page.type('#size', '2');
    await page.select('#sort', 'title_desc');

    await page.type('#category-input', 'シリーズ');
    await page.type('#tag-input', '対象');
    await page.click('#add-tag-button');

    await page.type('#category-input', 'ジャンル');
    await page.type('#tag-input', '少年');
    await page.click('#add-tag-button');

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe('/screen/summary');
    expect(currentUrl.searchParams.get('title')).toBe('target');
    expect(currentUrl.searchParams.get('start')).toBe('1');
    expect(currentUrl.searchParams.get('size')).toBe('2');
    expect(currentUrl.searchParams.get('sort')).toBe('title_desc');
    expect(currentUrl.searchParams.get('summaryPage')).toBe('1');
    expect(currentUrl.searchParams.getAll('tags')).toEqual(['シリーズ:対象', 'ジャンル:少年']);

    const chips = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.condition-list .chip'))
        .map(node => (node.textContent || '').trim())
        .filter(Boolean);
    });

    expect(chips).toEqual(expect.arrayContaining([
      'タイトル: target',
      'シリーズ:対象',
      'ジャンル:少年',
      '取得開始位置: 1',
      '取得数: 2',
    ]));

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('1 件');
  });
});
