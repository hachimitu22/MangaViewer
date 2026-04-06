const path = require('path');

const createApp = require('./app');
const { resolveLoginAuthConfig } = require('./app/createDependencies');
const { hasDevelopmentSession } = require('./app/developmentSession');

const parseSessionPaths = value => (value || '')
  .split(',')
  .map(entry => entry.trim())
  .filter(entry => entry.length > 0);

const createEnv = source => ({
  nodeEnv: source.NODE_ENV || 'development',
  port: Number.parseInt(source.PORT, 10) || 3000,
  databaseDialect: source.DATABASE_DIALECT || 'sqlite',
  databaseUrl: source.DATABASE_URL || '',
  databaseHost: source.DATABASE_HOST || '',
  databasePort: Number.parseInt(source.DATABASE_PORT, 10) || 5432,
  databaseName: source.DATABASE_NAME || '',
  databaseUsername: source.DATABASE_USERNAME || '',
  databasePassword: source.DATABASE_PASSWORD || '',
  databaseStoragePath: source.DATABASE_STORAGE_PATH
    || path.join(process.cwd(), 'var', 'data', 'mangaviewer.sqlite'),
  contentRootDirectory: source.CONTENT_ROOT_DIRECTORY
    || path.join(process.cwd(), 'public', 'contents'),
  devSessionToken: source.DEV_SESSION_TOKEN || '',
  devSessionUserId: source.DEV_SESSION_USER_ID || '',
  devSessionTtlMs: Number.parseInt(source.DEV_SESSION_TTL_MS, 10) || 0,
  devSessionPaths: parseSessionPaths(source.DEV_SESSION_PATHS),
  loginUsername: source.FIXED_LOGIN_USERNAME || source.LOGIN_USERNAME || '',
  loginPassword: source.FIXED_LOGIN_PASSWORD || source.LOGIN_PASSWORD || '',
  loginUserId: source.FIXED_LOGIN_USER_ID || source.LOGIN_USER_ID || '',
  loginSessionTtlMs: Number.parseInt(source.LOGIN_SESSION_TTL_MS, 10) || 86_400_000,
  logFilePath: source.LOG_FILE_PATH || path.join(process.cwd(), 'var', 'logs', 'mangaviewer.log'),
  logLevel: source.LOG_LEVEL || 'INFO',
  logOutputs: source.LOG_OUTPUTS
    || (source.NODE_ENV === 'test' ? 'memory' : 'console,file'),
});

const startServer = async () => {
  const env = createEnv(process.env);
  const loginAuthConfig = resolveLoginAuthConfig(env);
  if (String(env.nodeEnv || '').toLowerCase() !== 'production' && loginAuthConfig.isUsingDefaultCredentials) {
    console.warn('ログイン認証情報が未設定のため、非本番向けデフォルト資格情報 (admin/admin) を使用します');
  }
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
