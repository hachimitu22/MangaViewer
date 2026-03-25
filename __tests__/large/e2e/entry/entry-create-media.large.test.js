const fs = require('fs/promises');
const path = require('path');

const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { loginToSummary } = require('../support/login');

const login = async ({ baseUrl }) => {
  await loginToSummary({ page, baseUrl });
};

describe('large e2e: エントリー画面でメディアを新規登録できる', () => {
  let appContext;

  beforeEach(async () => {
    appContext = await bootstrapE2eApp({
      prefix: 'mangaviewer-e2e-entry-create-',
    });
  });

  afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }

    appContext = null;
  });

  test('entry で追加したタイトル・タグ・先頭コンテンツが summary/detail で確認できる', async () => {
    const { baseUrl, tempRootDirectory } = appContext;

    const title = 'entry-e2e-新規登録タイトル';
    const tagCategory = '作品種別';
    const tagLabel = '長編';

    const uploadFilePath = path.join(tempRootDirectory, 'entry-upload-1.jpg');
    await fs.writeFile(uploadFilePath, 'dummy-image-bytes', { encoding: 'utf8' });

    await login({ baseUrl });

    await page.goto(`${baseUrl}/screen/entry`, { waitUntil: 'networkidle0' });

    await page.type('#title', title);
    await page.type('#category-input', tagCategory);
    await page.type('#tag-input', tagLabel);
    await page.click('#add-tag-button');

    const fileInput = await page.$('#file-input');
    await fileInput.uploadFile(uploadFilePath);

    await page.waitForFunction(
      expectedFileName => document.querySelector('#media-list')?.innerText.includes(expectedFileName),
      {},
      path.basename(uploadFilePath),
    );

    const postMediaResponsePromise = page.waitForResponse(response => {
      return response.url() === `${baseUrl}/api/media` && response.request().method() === 'POST';
    });

    await page.click('button[type="submit"]');

    const postMediaResponse = await postMediaResponsePromise;
    expect(postMediaResponse.status()).toBe(200);

    const postMediaResponseBody = await postMediaResponse.json();
    expect(postMediaResponseBody.code).toBe(0);
    expect(postMediaResponseBody.mediaId).toMatch(/^[0-9a-f]{32}$/);

    const { mediaId } = postMediaResponseBody;

    await page.goto(`${baseUrl}/screen/summary`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(
      expectedTitle => document.body?.innerText.includes(expectedTitle),
      {},
      title,
    );

    const summaryText = await page.evaluate(() => document.body.innerText);
    expect(summaryText).toContain(title);

    await page.goto(`${baseUrl}/screen/detail/${mediaId}`, { waitUntil: 'networkidle0' });

    const detailText = await page.evaluate(() => document.body.innerText);
    expect(detailText).toContain(title);
    expect(detailText).toContain(`${tagCategory}:${tagLabel}`);

    const firstContentSnapshot = await page.evaluate(() => {
      const firstContentCard = document.querySelector('.content-card');
      if (!firstContentCard) {
        return null;
      }

      const thumbnailLink = firstContentCard.querySelector('a.thumbnail');
      const thumbnailImage = firstContentCard.querySelector('img');
      const contentMetaText = firstContentCard.querySelector('.content-meta')?.innerText ?? '';
      const matchedContentId = contentMetaText.match(/[0-9a-f]{32}/);

      return {
        viewerHref: thumbnailLink?.getAttribute('href') ?? '',
        thumbnailSrc: thumbnailImage?.getAttribute('src') ?? '',
        contentMetaText,
        contentId: matchedContentId ? matchedContentId[0] : '',
      };
    });

    expect(firstContentSnapshot).not.toBeNull();
    expect(firstContentSnapshot.viewerHref).toBe(`/screen/viewer/${mediaId}/1`);
    expect(firstContentSnapshot.contentMetaText).toContain('ページ: 1');
    expect(firstContentSnapshot.contentId).toMatch(/^[0-9a-f]{32}$/);
    expect(firstContentSnapshot.thumbnailSrc).toBe(firstContentSnapshot.contentId);
  });
});
