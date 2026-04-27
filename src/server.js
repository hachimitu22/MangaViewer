const path = require('path');

const createApp = require('./app');
const { assertRequiredSecurityConfiguration } = require('./app/createDependencies');
const { hasDevelopmentSession, isLoopbackHost } = require('./app/developmentSession');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseSessionPaths = value => (value || '')
  .split(',')
  .map(entry => entry.trim())
  .filter(entry => entry.length > 0);

const isConfigured = value => String(value || '').trim().length > 0;
const isNonProduction = nodeEnv => String(nodeEnv || '').toLowerCase() !== 'production';
const isProduction = nodeEnv => String(nodeEnv || '').toLowerCase() === 'production';

const resolveServerHost = (source = {}) => {
  const requestedHost = String(source.SERVER_HOST || source.HOST || '').trim();
  if (!requestedHost) {
    return '127.0.0.1';
  }
  if (requestedHost !== '0.0.0.0') {
    return requestedHost;
  }
  if (isProduction(source.NODE_ENV)) {
    return '0.0.0.0';
  }
  return '127.0.0.1';
};

const assertDevelopmentSessionConfigurationAllowed = (env, source = {}) => {
  if (!isProduction(env.nodeEnv)) {
    const isDevSessionEnabled = env.enableDevSession === 'true';
    const isLoopback = isLoopbackHost(env.host);
    const allowsRemoteDevSession = env.allowRemoteDevSession === 'true';
    if (isDevSessionEnabled && !isLoopback && !allowsRemoteDevSession) {
      const error = new Error('ENABLE_DEV_SESSION=true で loopback 以外の host は許可されません');
      error.code = 'DEV_SESSION_NON_LOOPBACK_HOST_DISALLOWED';
      throw error;
    }
    return;
  }

  const hasConfiguredDevSession = [
    source.DEV_SESSION_TOKEN,
    source.DEV_SESSION_USER_ID,
    source.DEV_SESSION_TTL_MS,
    source.DEV_SESSION_PATHS,
  ].some(isConfigured);

  if (!hasConfiguredDevSession) {
    return;
  }

  const error = new Error('本番環境では DEV_SESSION_* の設定を許可できません');
  error.code = 'DEV_SESSION_DISALLOWED_IN_PRODUCTION';
  throw error;
};

const createEnv = source => ({
  nodeEnv: source.NODE_ENV || 'development',
  port: Number.parseInt(source.PORT, 10) || 3000,
  host: resolveServerHost(source),
  appOrigin: source.APP_ORIGIN || '',
  allowedHosts: parseSessionPaths(source.APP_ALLOWED_HOSTS || '127.0.0.1,localhost,::1'),
  databaseStoragePath: source.DATABASE_STORAGE_PATH
    || path.join(process.cwd(), 'var', 'data', 'mangaviewer.sqlite'),
  contentRootDirectory: source.CONTENT_ROOT_DIRECTORY
    || path.join(process.cwd(), 'public', 'contents'),
  devSessionToken: source.DEV_SESSION_TOKEN || '',
  devSessionUserId: source.DEV_SESSION_USER_ID || '',
  devSessionTtlMs: Number.parseInt(source.DEV_SESSION_TTL_MS, 10) || 0,
  devSessionPaths: parseSessionPaths(source.DEV_SESSION_PATHS),
  enableDevSession: source.ENABLE_DEV_SESSION || '',
  allowRemoteDevSession: source.ALLOW_REMOTE_DEV_SESSION || '',
  logFilePath: source.LOG_FILE_PATH || path.join(process.cwd(), 'var', 'logs', 'mangaviewer.log'),
  logLevel: source.LOG_LEVEL || 'INFO',
  logOutputs: source.LOG_OUTPUTS
    || (source.NODE_ENV === 'test' ? 'memory' : 'console,file'),
});

const startServer = async () => {
  const env = createEnv(process.env);
  try {
    assertRequiredSecurityConfiguration(env);
    assertDevelopmentSessionConfigurationAllowed(env, process.env);
  } catch (error) {
    if (error?.code === 'APP_ORIGIN_REQUIRED') {
      console.error('サーバーの起動を中止しました: APP_ORIGIN を設定してください (例: http://127.0.0.1:3000)', error);
      process.exit(1);
      return;
    }
    if (error?.code === 'DEV_SESSION_DISALLOWED_IN_PRODUCTION') {
      console.error('サーバーの起動を中止しました: 本番環境で DEV_SESSION_* の設定は禁止されています', error);
      process.exit(1);
      return;
    }
    if (error?.code === 'DEV_SESSION_NON_LOOPBACK_HOST_DISALLOWED') {
      console.error([
        'サーバーの起動を中止しました: ENABLE_DEV_SESSION=true は loopback host 限定です',
        `host=${env.host}`,
        'どうしても許可する場合のみ ALLOW_REMOTE_DEV_SESSION=true を明示してください',
      ].join(': '), error);
      process.exit(1);
      return;
    }
    console.error('サーバーの起動に失敗しました: 設定を確認してください', error);
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

  const server = app.listen(env.port, env.host, () => {
    console.log(`サーバーを起動しました: host=${env.host}, port=${env.port}`);

    if (isNonProduction(env.nodeEnv) && !isConfigured(process.env.ENABLE_DEV_SESSION)) {
      console.log('開発用固定セッションは無効です: ENABLE_DEV_SESSION が未指定のため適用しません');
    }

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
  assertRequiredSecurityConfiguration,
  assertDevelopmentSessionConfigurationAllowed,
  createEnv,
  startServer,
};
