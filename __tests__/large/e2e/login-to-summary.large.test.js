const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const createApp = require('../../../src/app');
const Media = require('../../../src/domain/media/media');
const MediaId = require('../../../src/domain/media/mediaId');
const MediaTitle = require('../../../src/domain/media/mediaTitle');
const ContentId = require('../../../src/domain/media/contentId');
const Tag = require('../../../src/domain/media/tag');
const Category = require('../../../src/domain/media/category');
const Label = require('../../../src/domain/media/label');

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

const createSeedMedia = ({ mediaId, title, contentId }) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  [new ContentId(contentId)],
  [
    new Tag(new Category('カテゴリ'), new Label('ラベル')),
  ],
  [new Category('カテゴリ')],
);

describe('large e2e: ログイン画面からサマリー画面まで遷移する', () => {
  const seedTitle = 'seed済みタイトル';

  let app;
  let server;
  let baseUrl;
  let tempRootDirectory;
  let tempDatabasePath;
  let tempContentDirectory;

  beforeEach(async () => {
    tempRootDirectory = await createTempDirectory('mangaviewer-e2e-');
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

    await app.locals.dependencies.unitOfWork.run(async () => {
      await app.locals.dependencies.mediaRepository.save(createSeedMedia({
        mediaId: 'media-seed-1',
        title: seedTitle,
        contentId: 'seed/content-1.jpg',
      }));
    });

    await fs.mkdir(path.join(tempContentDirectory, 'seed'), { recursive: true });
    await fs.writeFile(path.join(tempContentDirectory, 'seed', 'content-1.jpg'), 'dummy', { encoding: 'utf8' });

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

  test('ログイン成功後に /screen/summary へ遷移して seed データが表示される', async () => {
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
