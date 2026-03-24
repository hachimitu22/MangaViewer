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

describe('large e2e auth: セッション期限切れ後は再認証が必要になる', () => {
  let app;
  let server;
  let baseUrl;
  let tempRootDirectory;
  let tempDatabasePath;
  let tempContentDirectory;

  beforeEach(async () => {
    tempRootDirectory = await createTempDirectory('mangaviewer-e2e-auth-expired-');
    tempDatabasePath = path.join(tempRootDirectory, 'db', 'test.sqlite');
    tempContentDirectory = path.join(tempRootDirectory, 'contents');

    app = createApp({
      databaseStoragePath: tempDatabasePath,
      contentRootDirectory: tempContentDirectory,
      loginUsername: 'admin',
      loginPassword: 'admin',
      loginUserId: 'admin',
      loginSessionTtlMs: 100,
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

  test('短いTTLでログイン後に期限切れになると保護画面アクセス時に認証エラーになる', async () => {
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

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toBe(`${baseUrl}/screen/summary`);

    await new Promise(resolve => setTimeout(resolve, 250));

    const expiredResponse = await page.goto(`${baseUrl}/screen/summary`, { waitUntil: 'networkidle0' });
    if (!expiredResponse) {
      throw new Error('期限切れ後レスポンスの取得に失敗しました');
    }

    const status = expiredResponse.status();
    const currentUrl = page.url();
    const bodyText = await page.evaluate(() => document.body ? document.body.innerText : '');

    const redirectedToLoginOrErrorScreen =
      currentUrl === `${baseUrl}/screen/login`
      || currentUrl === `${baseUrl}/screen/error`;
    const returnedAuthError = status === 401 && bodyText.includes('認証に失敗しました');

    expect(redirectedToLoginOrErrorScreen || returnedAuthError).toBe(true);
  });
});
