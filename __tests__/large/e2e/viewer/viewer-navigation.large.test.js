const fs = require('fs/promises');
const { test, expect } = require('@playwright/test');

let page;

const Media = require('../../../../src/domain/media/media');
const MediaId = require('../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../src/domain/media/contentId');
const Tag = require('../../../../src/domain/media/tag');
const Category = require('../../../../src/domain/media/category');
const Label = require('../../../../src/domain/media/label');
const { toPublicContentPath } = require('../../../../src/controller/screen/publicContentPath');
const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');

const createViewerSeedMedia = ({ mediaId, title, contentIds }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  contentIds.map(contentId => new ContentId(contentId)),
  [new Tag(new Category('カテゴリ'), new Label('ラベル'))],
  [new Category('カテゴリ')],
);

const toExpectedPublicPath = contentId => toPublicContentPath(contentId);

test.describe('large e2e: viewer ナビゲーション', () => {
  const seedMediaId = 'media-seed-viewer-navigation-1';
  const seedTitle = 'ビューアー遷移確認用タイトル';
  const seedContentIds = [
    '11111111111111111111111111111111',
    '22222222222222222222222222222222',
  ];

  let context;

  test.beforeEach(async ({ page: currentPage }) => {
    page = currentPage;
    context = await bootstrapE2eApp({
      prefix: 'mangaviewer-e2e-viewer-',
      seed: async ({ app, tempContentDirectory, path }) => {
        await app.locals.dependencies.unitOfWork.run(async () => {
          await app.locals.dependencies.mediaRepository.save(createViewerSeedMedia({
            mediaId: seedMediaId,
            title: seedTitle,
            contentIds: seedContentIds,
          }));
        });

        await Promise.all(seedContentIds.map(contentId => {
          const imageDirectory = path.join(
            tempContentDirectory,
            contentId.slice(0, 2),
            contentId.slice(2, 4),
            contentId.slice(4, 6),
            contentId.slice(6, 8),
          );
          return fs.mkdir(imageDirectory, { recursive: true })
            .then(() => fs.writeFile(path.join(imageDirectory, contentId), 'dummy', { encoding: 'utf8' }));
        }));
      },
    });
  });

  test.afterEach(async () => {
    if (context?.teardown) {
      await context.teardown();
    }
    context = null;
  });

  test('viewer の前後ページ移動と境界ナビゲーション制御が正しく表示される', async () => {
    const { baseUrl } = context;

    await page.goto(`${baseUrl}/screen/viewer/${seedMediaId}/1`, { waitUntil: 'networkidle' });

    const firstImage = await page.$eval('.stage img', element => element.getAttribute('src'));
    expect(firstImage).toBe(toExpectedPublicPath(seedContentIds[0]));
    expect(await page.$(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/0"]`)).toBeNull();

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/2"]`),
    ]);

    expect(page.url()).toBe(`${baseUrl}/screen/viewer/${seedMediaId}/2`);
    const secondImage = await page.$eval('.stage img', element => element.getAttribute('src'));
    expect(secondImage).toBe(toExpectedPublicPath(seedContentIds[1]));

    expect(await page.$(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/3"]`)).toBeNull();
    await expect(page.locator('nav.footer-nav')).toContainText('次ページなし');
  });
});
