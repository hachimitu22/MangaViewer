const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const createApp = require('../../../../src/app');

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

describe('large e2e auth: 未ログイン状態で保護画面へ直接アクセスすると認証が要求される', () => {
  let app;
  let server;
  let baseUrl;
  let tempRootDirectory;
  let tempDatabasePath;
  let tempContentDirectory;

  beforeEach(async () => {
    tempRootDirectory = await createTempDirectory('mangaviewer-e2e-auth-unauth-');
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

  test.each(['/screen/summary', '/screen/favorite', '/screen/queue'])(
    '%s に未認証でアクセスするとログイン導線または認証エラーになる',
    async (screenPath) => {
      const response = await page.goto(`${baseUrl}${screenPath}`, { waitUntil: 'networkidle0' });
      if (!response) {
        throw new Error('初回レスポンスの取得に失敗しました');
      }

      const status = response.status();
      const currentUrl = page.url();
      const bodyText = await page.evaluate(() => document.body ? document.body.innerText : '');

      const redirectedToLoginOrErrorScreen =
        currentUrl === `${baseUrl}/screen/login`
        || currentUrl === `${baseUrl}/screen/error`;
      const returnedAuthError = status === 401 && bodyText.includes('認証に失敗しました');

      expect(redirectedToLoginOrErrorScreen || returnedAuthError).toBe(true);
    },
  );
});
