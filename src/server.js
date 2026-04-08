const path = require('path');

const createApp = require('./app');
const { resolveLoginAuthConfig } = require('./app/createDependencies');
const { hasDevelopmentSession } = require('./app/developmentSession');


const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

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
  loginPasswordHash: source.FIXED_LOGIN_PASSWORD_HASH || source.LOGIN_PASSWORD_HASH || '',
  loginUserId: source.FIXED_LOGIN_USER_ID || source.LOGIN_USER_ID || '',
  allowInsecureDefaultLogin: source.ALLOW_INSECURE_DEFAULT_LOGIN || '',
  loginSessionTtlMs: Number.parseInt(source.LOGIN_SESSION_TTL_MS, 10) || 86_400_000,
  authStateStoreBackend: source.AUTH_STATE_STORE_BACKEND || 'memory',
  redisUrl: source.REDIS_URL || '',
  redisSessionKeyPrefix: source.REDIS_SESSION_KEY_PREFIX || 'session',
  redisAuthKeyPrefix: source.REDIS_AUTH_KEY_PREFIX || 'auth',
  loginRateLimitWindowMs: Number.parseInt(source.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 60_000,
  loginFailureStateTtlMs: Number.parseInt(source.LOGIN_FAILURE_STATE_TTL_MS, 10) || 86_400_000,
  authStoreFailurePolicy: source.AUTH_STORE_FAILURE_POLICY || 'fail_close',
  loginHashMemoryCost: parsePositiveInt(source.LOGIN_HASH_MEMORY_COST, 65_536),
  loginHashIterations: parsePositiveInt(source.LOGIN_HASH_ITERATIONS, 16_384),
  loginHashParallelism: parsePositiveInt(source.LOGIN_HASH_PARALLELISM, 1),
  loginHashTimeCost: parsePositiveInt(source.LOGIN_HASH_TIME_COST, 8),
  logFilePath: source.LOG_FILE_PATH || path.join(process.cwd(), 'var', 'logs', 'mangaviewer.log'),
  logLevel: source.LOG_LEVEL || 'INFO',
  logOutputs: source.LOG_OUTPUTS
    || (source.NODE_ENV === 'test' ? 'memory' : 'console,file'),
});

const startServer = async () => {
  const env = createEnv(process.env);
  try {
    resolveLoginAuthConfig(env);
  } catch (error) {
    if (error?.code === 'INSECURE_DEFAULT_LOGIN_DISALLOWED_IN_PRODUCTION') {
      console.error('サーバーの起動を中止しました: 本番環境で insecure login(ALLOW_INSECURE_DEFAULT_LOGIN=true) は禁止されています', error);
      process.exit(1);
      return;
    }
    console.error('サーバーの起動に失敗しました: ログイン認証設定が不足しています', error);
    process.exit(1);
    return;
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
