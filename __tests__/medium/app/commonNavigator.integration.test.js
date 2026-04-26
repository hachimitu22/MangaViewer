const createApp = require('../../../src/app');
const requestApp = async ({ app, method, targetPath } = {}) => {
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${targetPath}`, {
      method,
    });

    return {
      status: response.status,
      bodyText: await response.text(),
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
};

describe('medium: common navigator integration', () => {
  const createTestApp = () => createApp({
    databaseStoragePath: ':memory:',
    contentRootDirectory: '/tmp/mangaviewer-medium-common-nav-contents',
  });

  test('/screen/summary にメディア登録リンクが表示される', async () => {
    const app = createTestApp();

    try {
      await app.locals.ready;
      const response = await requestApp({
        app,
        method: 'GET',
        targetPath: '/screen/summary',
      });

      expect(response.status).toBe(200);
      expect(response.bodyText).toContain('共通ナビゲーター');
      expect(response.bodyText).toContain('メディア一覧');
      expect(response.bodyText).toContain('>メディア登録<');
    } finally {
      await app.locals.close();
    }
  });
});
