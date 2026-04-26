const path = require('path');

const createApp = require('./app');
const { assertRequiredSecurityConfiguration } = require('./app/createDependencies');

const parseSessionPaths = value => (value || '').split(',').map(entry => entry.trim()).filter(entry => entry.length > 0);

const resolveServerHost = (source = {}) => {
  const requestedHost = String(source.SERVER_HOST || source.HOST || '').trim();
  if (!requestedHost) return '127.0.0.1';
  if (requestedHost !== '0.0.0.0') return requestedHost;
  return String(source.NODE_ENV || '').toLowerCase() === 'production' ? '0.0.0.0' : '127.0.0.1';
};

const createEnv = source => ({
  nodeEnv: source.NODE_ENV || 'development',
  port: Number.parseInt(source.PORT, 10) || 3000,
  host: resolveServerHost(source),
  appOrigin: source.APP_ORIGIN || '',
  allowedHosts: parseSessionPaths(source.APP_ALLOWED_HOSTS || '127.0.0.1,localhost,::1'),
  databaseStoragePath: source.DATABASE_STORAGE_PATH || path.join(process.cwd(), 'var', 'data', 'mangaviewer.sqlite'),
  contentRootDirectory: source.CONTENT_ROOT_DIRECTORY || path.join(process.cwd(), 'public', 'contents'),
  logFilePath: source.LOG_FILE_PATH || path.join(process.cwd(), 'var', 'logs', 'mangaviewer.log'),
  logLevel: source.LOG_LEVEL || 'INFO',
  logOutputs: source.LOG_OUTPUTS || (source.NODE_ENV === 'test' ? 'memory' : 'console,file'),
});

const startServer = async () => {
  const env = createEnv(process.env);
  try {
    assertRequiredSecurityConfiguration(env);
  } catch (error) {
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

module.exports = { assertRequiredSecurityConfiguration, createEnv, startServer };
