const path = require('path');

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
  loginSessionTtlMs: Number.parseInt(source.LOGIN_SESSION_TTL_MS, 10) || 86_400_000,
  loginPasswordHashAlgorithm: source.LOGIN_PASSWORD_HASH_ALGORITHM || 'bcrypt',
  loginPasswordHashMemoryCost: Number.parseInt(source.LOGIN_PASSWORD_HASH_MEMORY_COST, 10) || 65_536,
  loginPasswordHashIterations: Number.parseInt(source.LOGIN_PASSWORD_HASH_ITERATIONS, 10) || 3,
  loginPasswordHashParallelism: Number.parseInt(source.LOGIN_PASSWORD_HASH_PARALLELISM, 10) || 1,
  loginPasswordHashTimeCost: Number.parseInt(source.LOGIN_PASSWORD_HASH_TIME_COST, 10) || 3,
  loginPasswordHashBcryptCost: Number.parseInt(source.LOGIN_PASSWORD_HASH_BCRYPT_COST, 10) || 12,
  allowLegacySessionTokenHeader: source.ALLOW_LEGACY_SESSION_TOKEN_HEADER || '',
  logFilePath: source.LOG_FILE_PATH || path.join(process.cwd(), 'var', 'logs', 'mangaviewer.log'),
  logLevel: source.LOG_LEVEL || 'INFO',
  logOutputs: source.LOG_OUTPUTS
    || (source.NODE_ENV === 'test' ? 'memory' : 'console,file'),
});

module.exports = {
  createEnv,
};
