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
const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');

const createViewerSeedMedia = ({ mediaId, title, contentIds }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  contentIds.map(contentId => new ContentId(contentId)),
  [
    new Tag(new Category('カテゴリ'), new Label('ラベル')),
  ],
  [new Category('カテゴリ')],
);

test.describe('large e2e: viewer ナビゲーション', () => {
  const seedMediaId = 'media-seed-viewer-navigation-1';
  const seedTitle = 'ビューアー遷移確認用タイトル';
  const seedContentIds = [
    'seed/viewer-navigation-content-1.jpg',
    'seed/viewer-navigation-content-2.jpg',
    'seed/viewer-navigation-content-3.jpg',
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

        await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });

        await Promise.all(seedContentIds.map(contentId => {
          return fs.writeFile(path.join(tempContentDirectory, contentId), 'dummy', { encoding: 'utf8' });
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

  const login = async ({ page, baseUrl }) => {
    await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle' });

    await page.type('#username', 'admin');
    await page.type('#password', 'admin');

    const loginResponsePromise = page.waitForResponse(response => {
      return response.url() === `${baseUrl}/api/login` && response.request().method() === 'POST';
    });

    await page.click('button[type="submit"]');

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);
    await expect(loginResponse.json()).resolves.toMatchObject({ code: 0 });

    await page.waitForNavigation({ waitUntil: 'networkidle' });
    expect(page.url()).toBe(`${baseUrl}/screen/summary`);
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

  test('一覧から viewer へ遷移し、前後ページ移動と境界ナビゲーション制御が正しく表示される', async () => {
    const { baseUrl } = context;

    await login({ page, baseUrl });

    const viewerEntryHref = `/screen/viewer/${seedMediaId}/1`;
    await page.waitForSelector(`a[href="${viewerEntryHref}"]`);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click(`a[href="${viewerEntryHref}"]`),
    ]);

    await assertViewerState({
      page,
      baseUrl,
      mediaId: seedMediaId,
      mediaPage: 1,
      expectedContentId: seedContentIds[0],
    });

    expect(await page.$(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/0"]`)).toBeNull();
    const previousDisabledTextAtFirstPage = await page.$eval('nav.footer-nav span.disabled', element => element.textContent.trim());
    expect(previousDisabledTextAtFirstPage).toBe('前ページなし');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/2"]`),
    ]);

    await assertViewerState({
      page,
      baseUrl,
      mediaId: seedMediaId,
      mediaPage: 2,
      expectedContentId: seedContentIds[1],
    });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/1"]`),
    ]);

    await assertViewerState({
      page,
      baseUrl,
      mediaId: seedMediaId,
      mediaPage: 1,
      expectedContentId: seedContentIds[0],
    });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/2"]`),
    ]);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/3"]`),
    ]);

    await assertViewerState({
      page,
      baseUrl,
      mediaId: seedMediaId,
      mediaPage: 3,
      expectedContentId: seedContentIds[2],
    });

    expect(await page.$(`nav.footer-nav a[href="/screen/viewer/${seedMediaId}/4"]`)).toBeNull();
    const footerTextsAtLastPage = await page.$$eval('nav.footer-nav span.disabled', elements => {
      return elements.map(element => element.textContent.trim());
    });
    expect(footerTextsAtLastPage).toContain('次ページなし');
  });
});
