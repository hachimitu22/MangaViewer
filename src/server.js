const path = require('path');

const createApp = require('./app');
const { assertRequiredSecurityConfiguration } = require('./app/createDependencies');


const parseSessionPaths = value => (value || '')
  .split(',')
  .map(entry => entry.trim())
  .filter(entry => entry.length > 0);

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
  logFilePath: source.LOG_FILE_PATH || path.join(process.cwd(), 'var', 'logs', 'mangaviewer.log'),
  logLevel: source.LOG_LEVEL || 'INFO',
  logOutputs: source.LOG_OUTPUTS
    || (source.NODE_ENV === 'test' ? 'memory' : 'console,file'),
});

const startServer = async () => {
  const env = createEnv(process.env);
  try {
    assertRequiredSecurityConfiguration(env);
  } catch (error) {
    if (error?.code === 'APP_ORIGIN_REQUIRED') {
      console.error('サーバーの起動を中止しました: APP_ORIGIN を設定してください (例: http://127.0.0.1:3000)', error);
      process.exit(1);
      return;
    }
    console.error('サーバーの起動に失敗しました', error);
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
  });

  server.on('error', error => {
    console.error('サーバーの起動に失敗しました', error);
    process.exit(1);
  });
};

startServer();

module.exports = {
  assertRequiredSecurityConfiguration,
  createEnv,
  startServer,
};
