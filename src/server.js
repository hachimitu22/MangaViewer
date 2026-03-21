const path = require('path');

const createApp = require('./app');

const createEnv = source => ({
  port: Number.parseInt(source.PORT, 10) || 3000,
  databaseStoragePath: source.DATABASE_STORAGE_PATH
    || path.join(process.cwd(), 'var', 'data', 'mangaviewer.sqlite'),
  contentRootDirectory: source.CONTENT_ROOT_DIRECTORY
    || path.join(process.cwd(), 'var', 'contents'),
});

const startServer = async () => {
  const env = createEnv(process.env);
  const app = createApp(env);

  try {
    await app.locals.ready;
  } catch (error) {
    console.error('アプリケーションの初期化に失敗しました', error);
    process.exit(1);
    return;
  }

  const server = app.listen(env.port, () => {
    console.log(`サーバーを起動しました: port=${env.port}`);
  });

  server.on('error', error => {
    console.error('サーバーの起動に失敗しました', error);
    process.exit(1);
  });
};

startServer();

module.exports = {
  createEnv,
  startServer,
};
