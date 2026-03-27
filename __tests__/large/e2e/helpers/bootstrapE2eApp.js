const fs = require('fs/promises');
const path = require('path');

const createApp = require('../../../../src/app');
const { removePathIfExists } = require('./fsCleanup');
const { createE2eTempDirectory } = require('./e2eTempDirectory');


const listenServer = app => new Promise((resolve, reject) => {
  const listeningServer = app.listen(0, () => resolve(listeningServer));
  listeningServer.on('error', reject);
});

const resolveBaseUrl = server => {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('テストサーバーの待受ポート解決に失敗しました');
  }

  return `http://127.0.0.1:${address.port}`;
};

const bootstrapE2eApp = async ({
  prefix = 'mangaviewer-e2e-',
  loginUsername = 'admin',
  loginPassword = 'admin',
  loginUserId = 'admin',
  loginSessionTtlMs = 60_000,
  seed,
} = {}) => {
  const tempRootDirectory = await createE2eTempDirectory(prefix);
  const tempDatabasePath = path.join(tempRootDirectory, 'db', 'test.sqlite');
  const tempContentDirectory = path.join(tempRootDirectory, 'contents');

  const app = createApp({
    databaseStoragePath: tempDatabasePath,
    contentRootDirectory: tempContentDirectory,
    loginUsername,
    loginPassword,
    loginUserId,
    loginSessionTtlMs,
  });

  await app.locals.ready;

  if (seed) {
    await seed({
      app,
      tempRootDirectory,
      tempDatabasePath,
      tempContentDirectory,
      fs,
      path,
    });
  }

  const server = await listenServer(app);
  const baseUrl = resolveBaseUrl(server);

  const teardown = async () => {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }

    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });

    if (app?.locals?.close) {
      await app.locals.close();
    }

    await removePathIfExists(tempRootDirectory);
  };

  return {
    app,
    server,
    baseUrl,
    tempRootDirectory,
    tempDatabasePath,
    tempContentDirectory,
    teardown,
  };
};

module.exports = {
  bootstrapE2eApp,
};
