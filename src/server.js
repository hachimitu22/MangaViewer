const path = require('path');

const createApp = require('./app');
const { hasDevelopmentSession } = require('./app/developmentSession');

const parseSessionPaths = value => (value || '')
  .split(',')
  .map(entry => entry.trim())
  .filter(entry => entry.length > 0);

const createEnv = source => ({
  port: Number.parseInt(source.PORT, 10) || 3000,
  databaseStoragePath: source.DATABASE_STORAGE_PATH
    || path.join(process.cwd(), 'var', 'data', 'mangaviewer.sqlite'),
  contentRootDirectory: source.CONTENT_ROOT_DIRECTORY
    || path.join(process.cwd(), 'var', 'contents'),
  devSessionToken: source.DEV_SESSION_TOKEN || '',
  devSessionUserId: source.DEV_SESSION_USER_ID || '',
  devSessionTtlMs: Number.parseInt(source.DEV_SESSION_TTL_MS, 10) || 0,
  devSessionPaths: parseSessionPaths(source.DEV_SESSION_PATHS),
  loginUsername: source.FIXED_LOGIN_USERNAME || source.LOGIN_USERNAME || '',
  loginPassword: source.FIXED_LOGIN_PASSWORD || source.LOGIN_PASSWORD || '',
  loginUserId: source.FIXED_LOGIN_USER_ID || source.LOGIN_USER_ID || '',
  loginSessionTtlMs: Number.parseInt(source.LOGIN_SESSION_TTL_MS, 10) || 86_400_000,
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

    if (hasDevelopmentSession(env)) {
      console.log([
        '開発用固定セッションを有効化しました',
        `userId=${env.devSessionUserId}`,
        `paths=${env.devSessionPaths.join(',')}`,
      ].join(': '));
    }
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
