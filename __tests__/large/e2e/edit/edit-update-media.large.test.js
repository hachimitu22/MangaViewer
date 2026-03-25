const fs = require('fs/promises');

const Media = require('../../../../src/domain/media/media');
const MediaId = require('../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../src/domain/media/contentId');
const Tag = require('../../../../src/domain/media/tag');
const Category = require('../../../../src/domain/media/category');
const Label = require('../../../../src/domain/media/label');
const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { loginToSummary } = require('../support/login');

const createSeedMedia = ({ mediaId, title, contentIds, tags }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  contentIds.map(contentId => new ContentId(contentId)),
  tags.map(tag => new Tag(new Category(tag.category), new Label(tag.label))),
  [new Category(tags[0].category)],
);

const login = async ({ page, baseUrl }) => {
  await loginToSummary({ page, baseUrl });
};

const assertViewerState = async ({ page, baseUrl, mediaId, mediaPage, expectedContentId }) => {
  expect(page.url()).toBe(`${baseUrl}/screen/viewer/${mediaId}/${mediaPage}`);

  const metaText = await page.$eval('.meta-chip', element => element.textContent.trim());
  expect(metaText).toContain(`mediaId: ${mediaId}`);
  expect(metaText).toContain(`page: ${mediaPage}`);

  const imageState = await page.$eval('.stage img', element => ({
    src: element.getAttribute('src'),
    alt: element.getAttribute('alt'),
  }));

  expect(imageState.src).toBe(expectedContentId);
  expect(imageState.alt).toBe(`${mediaId} の ${mediaPage} ページ`);
};

describe('large e2e: edit 画面での既存メディア更新', () => {
  const seedMediaId = 'media-seed-edit-update-1';
  const initialTitle = '編集前タイトル';
  const updatedTitle = '編集後タイトル';
  const initialTags = [
    { category: 'ジャンル', label: '初期タグ' },
    { category: '作者', label: '初期作者' },
  ];
  const updatedTags = [
    { category: 'ジャンル', label: '更新タグ' },
    { category: '連載', label: '連載中' },
  ];
  const seedContentIds = [
    'seed/edit-update-content-1.jpg',
    'seed/edit-update-content-2.jpg',
    'seed/edit-update-content-3.jpg',
  ];

  let context;

  beforeEach(async () => {
    context = await bootstrapE2eApp({
      prefix: 'mangaviewer-e2e-edit-update-',
      seed: async ({ app, tempContentDirectory, path }) => {
        await app.locals.dependencies.unitOfWork.run(async () => {
          await app.locals.dependencies.mediaRepository.save(createSeedMedia({
            mediaId: seedMediaId,
            title: initialTitle,
            contentIds: seedContentIds,
            tags: initialTags,
          }));
        });

        await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
        await Promise.all(seedContentIds.map(contentId => {
          return fs.writeFile(path.join(tempContentDirectory, contentId), 'dummy', { encoding: 'utf8' });
        }));
      },
    });
  });

  afterEach(async () => {
    if (context?.teardown) {
      await context.teardown();
    }
    context = null;
  });

  test('初期値表示・編集送信・一覧反映・ビューアー順序変更を確認できる', async () => {
    const { baseUrl } = context;

    await login({ page, baseUrl });

    await page.goto(`${baseUrl}/screen/edit/${seedMediaId}`, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#title');
    await expect(page.$eval('#title', element => element.value)).resolves.toBe(initialTitle);

    const initialTagTexts = await page.$$eval('#tag-list .tag-item', elements => {
      return elements.map(element => element.textContent.replace(/\s+/g, ' ').trim());
    });
    expect(initialTagTexts).toEqual(expect.arrayContaining([
      expect.stringContaining('ジャンル'),
      expect.stringContaining('初期タグ'),
      expect.stringContaining('作者'),
      expect.stringContaining('初期作者'),
    ]));

    const initialMediaTexts = await page.$$eval('#media-list .media-item .media-item-body', elements => {
      return elements.map(element => element.textContent.replace(/\s+/g, ' ').trim());
    });
    expect(initialMediaTexts).toHaveLength(seedContentIds.length);
    expect(initialMediaTexts.every(text => text.startsWith('既存 contentId: '))).toBe(true);

    await page.click('#title', { clickCount: 3 });
    await page.type('#title', updatedTitle);

    await page.click('button[data-remove-tag="1"]');
    await page.click('button[data-remove-tag="0"]');

    await page.type('#category-input', updatedTags[0].category);
    await page.type('#tag-input', updatedTags[0].label);
    await page.click('#add-tag-button');

    await page.type('#category-input', updatedTags[1].category);
    await page.type('#tag-input', updatedTags[1].label);
    await page.click('#add-tag-button');

    await page.click('button[data-move-down="0"]');
    await page.click('button[data-move-up="2"]');

    const patchResponsePromise = page.waitForResponse(response => {
      return response.url() === `${baseUrl}/api/media/${seedMediaId}` && response.request().method() === 'PATCH';
    });

    await page.click('button[type="submit"]');

    const patchResponse = await patchResponsePromise;
    expect(patchResponse.status()).toBe(200);
    await expect(patchResponse.json()).resolves.toEqual({ code: 0 });

    const successMessage = await page.$eval('#form-message', element => element.textContent.trim());
    expect(successMessage).toBe('メディアを更新しました。');

    await page.goto(`${baseUrl}/screen/detail/${seedMediaId}`, { waitUntil: 'networkidle0' });
    const detailText = await page.evaluate(() => document.body.innerText);
    expect(detailText).toContain(updatedTitle);
    expect(detailText).toContain('ジャンル:更新タグ');
    expect(detailText).toContain('連載:連載中');

    await page.goto(`${baseUrl}/screen/summary`, { waitUntil: 'networkidle0' });
    const summaryText = await page.evaluate(() => document.body.innerText);
    expect(summaryText).toContain(updatedTitle);
    expect(summaryText).toContain('ジャンル:更新タグ');
    expect(summaryText).toContain('連載:連載中');

    const expectedContentIdsAfterReorder = [
      seedContentIds[1],
      seedContentIds[2],
      seedContentIds[0],
    ];

    await page.goto(`${baseUrl}/screen/viewer/${seedMediaId}/1`, { waitUntil: 'networkidle0' });
    await assertViewerState({
      page,
      baseUrl,
      mediaId: seedMediaId,
      mediaPage: 1,
      expectedContentId: expectedContentIdsAfterReorder[0],
    });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/2"]`),
    ]);
    await assertViewerState({
      page,
      baseUrl,
      mediaId: seedMediaId,
      mediaPage: 2,
      expectedContentId: expectedContentIdsAfterReorder[1],
    });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/3"]`),
    ]);
    await assertViewerState({
      page,
      baseUrl,
      mediaId: seedMediaId,
      mediaPage: 3,
      expectedContentId: expectedContentIdsAfterReorder[2],
    });
  });
});
