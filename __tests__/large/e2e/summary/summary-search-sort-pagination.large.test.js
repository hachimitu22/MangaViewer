const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const createApp = require('../../../../src/app');
const Media = require('../../../../src/domain/media/media');
const MediaId = require('../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../src/domain/media/contentId');
const Tag = require('../../../../src/domain/media/tag');
const Category = require('../../../../src/domain/media/category');
const Label = require('../../../../src/domain/media/label');

const createTempDirectory = prefix => fs.mkdtemp(path.join(os.tmpdir(), prefix));

const removePathIfExists = async targetPath => {
  if (!targetPath) {
    return;
  }

  await fs.rm(targetPath, {
    recursive: true,
    force: true,
  });
};

const createSeedMedia = ({
  mediaId,
  title,
  contentId,
  tags,
  registeredAt,
}) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  [new ContentId(contentId)],
  tags.map(({ category, label }) => new Tag(new Category(category), new Label(label))),
  [new Category(tags[0].category)],
  registeredAt,
);

const login = async ({ page, baseUrl }) => {
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

const readSummaryTitles = async (currentPage) => currentPage.evaluate(() => {
  const headingElements = Array.from(document.querySelectorAll('.media-card h2'));
  return headingElements.map(node => (node.textContent || '').trim()).filter(Boolean);
});

const readDetailLinks = async (currentPage) => currentPage.evaluate(() => {
  return Array.from(document.querySelectorAll('.media-card .actions a'))
    .filter(link => (link.textContent || '').includes('詳細画面へ'))
    .map(link => ({
      text: (link.textContent || '').trim(),
      href: link.getAttribute('href') || '',
    }));
});

describe('large e2e: summary の検索・並び替え・ページング', () => {
  let app;
  let server;
  let baseUrl;
  let tempRootDirectory;
  let tempDatabasePath;
  let tempContentDirectory;

  beforeEach(async () => {
    tempRootDirectory = await createTempDirectory('mangaviewer-summary-e2e-');
    tempDatabasePath = path.join(tempRootDirectory, 'db', 'test.sqlite');
    tempContentDirectory = path.join(tempRootDirectory, 'contents');

    app = createApp({
      databaseStoragePath: tempDatabasePath,
      contentRootDirectory: tempContentDirectory,
      loginUsername: 'admin',
      loginPassword: 'admin',
      loginUserId: 'admin',
      loginSessionTtlMs: 60_000,
    });

    await app.locals.ready;

    const seedMedias = [
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
        tags: [
          { category: 'シリーズ', label: '対象' },
          { category: 'ジャンル', label: '少女' },
        ],
        registeredAt: new Date('2024-01-02T00:00:00.000Z'),
      }),
      createSeedMedia({
        mediaId: 'media-3',
        title: 'Beta target',
        contentId: 'seed/content-3.jpg',
        tags: [
          { category: 'シリーズ', label: '対象' },
          { category: 'ジャンル', label: '青年' },
        ],
        registeredAt: new Date('2024-01-03T00:00:00.000Z'),
      }),
      createSeedMedia({
        mediaId: 'media-4',
        title: 'No hit item',
        contentId: 'seed/content-4.jpg',
        tags: [{ category: 'ジャンル', label: '一般' }],
        registeredAt: new Date('2024-01-04T00:00:00.000Z'),
      }),
    ];

    await app.locals.dependencies.unitOfWork.run(async () => {
      await Promise.all(seedMedias.map(media => app.locals.dependencies.mediaRepository.save(media)));
    });

    await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(tempContentDirectory, 'seed', 'content-1.jpg'), 'dummy-1', { encoding: 'utf8' }),
      fs.writeFile(path.join(tempContentDirectory, 'seed', 'content-2.jpg'), 'dummy-2', { encoding: 'utf8' }),
      fs.writeFile(path.join(tempContentDirectory, 'seed', 'content-3.jpg'), 'dummy-3', { encoding: 'utf8' }),
      fs.writeFile(path.join(tempContentDirectory, 'seed', 'content-4.jpg'), 'dummy-4', { encoding: 'utf8' }),
    ]);

    server = await new Promise((resolve, reject) => {
      const listeningServer = app.listen(0, () => resolve(listeningServer));
      listeningServer.on('error', reject);
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('テストサーバーの待受ポート解決に失敗しました');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      });
      server = null;
    }

    if (app?.locals?.close) {
      await app.locals.close();
    }

    await removePathIfExists(tempRootDirectory);

    app = null;
    baseUrl = null;
    tempRootDirectory = null;
    tempDatabasePath = null;
    tempContentDirectory = null;
  });

  test('検索・並び替え・ページングで query を維持しつつ詳細リンクが正しい', async () => {
    await login({ page, baseUrl });

    const summaryUrl = `${baseUrl}/screen/summary?summaryPage=1&size=2&sort=title_asc&title=target&tags=${encodeURIComponent('シリーズ:対象')}`;
    await page.goto(summaryUrl, { waitUntil: 'networkidle0' });

    await page.waitForSelector('.media-card h2');

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('メディア一覧');
    expect(bodyText).toContain('3 件');

    const filteredTitles = await readSummaryTitles(page);
    expect(filteredTitles).toEqual(['Alpha target', 'Beta target']);

    const detailLinks = await readDetailLinks(page);
    expect(detailLinks).toEqual([
      { text: '詳細画面へ', href: '/screen/detail/media-1' },
      { text: '詳細画面へ', href: '/screen/detail/media-3' },
    ]);

    await page.select('#sort', 'title_desc');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const sortedTitles = await readSummaryTitles(page);
    expect(sortedTitles).toEqual(['Gamma target', 'Beta target']);

    const sortedPageUrl = new URL(page.url());
    expect(sortedPageUrl.searchParams.get('summaryPage')).toBe('1');
    expect(sortedPageUrl.searchParams.get('sort')).toBe('title_desc');
    expect(sortedPageUrl.searchParams.get('size')).toBe('2');
    expect(sortedPageUrl.searchParams.get('title')).toBe('target');

    await page.goto(
      `${baseUrl}/screen/summary?summaryPage=1&size=1&sort=title_asc&title=target&tags=${encodeURIComponent('シリーズ:対象')}`,
      {
      waitUntil: 'networkidle0',
      },
    );

    await page.waitForSelector('a.page-link');

    const secondPageHref = await page.evaluate(() => {
      const pageLink = Array.from(document.querySelectorAll('a.page-link')).find(link => {
        return (link.textContent || '').trim() === '2';
      });
      return pageLink ? pageLink.getAttribute('href') : null;
    });

    expect(secondPageHref).not.toBeNull();

    const secondPageQuery = new URL(secondPageHref, 'http://localhost').searchParams;
    expect(secondPageQuery.get('summaryPage')).toBe('2');
    expect(secondPageQuery.get('sort')).toBe('title_asc');
    expect(secondPageQuery.get('size')).toBe('1');
    expect(secondPageQuery.get('tags')).toBe('シリーズ:対象');

    await page.goto(
      `${baseUrl}/screen/summary?summaryPage=1&size=1&sort=title_asc&title=target&tags=${encodeURIComponent('ジャンル:少年')}`,
      { waitUntil: 'networkidle0' },
    );

    const tagFilteredBodyText = await page.evaluate(() => document.body.innerText);
    expect(tagFilteredBodyText).toContain('1 件');

    const detailLinksAfterTagFilter = await readDetailLinks(page);
    expect(detailLinksAfterTagFilter).toEqual([{ text: '詳細画面へ', href: '/screen/detail/media-1' }]);
  });
});
