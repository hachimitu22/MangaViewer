const fs = require('fs');
const path = require('path');

const { Sequelize } = require('sequelize');

const setRouterApiMediaPost = require('../controller/router/media/setRouterApiMediaPost');
const setRouterApiMediaPatch = require('../controller/router/media/setRouterApiMediaPatch');
const setRouterApiMediaDelete = require('../controller/router/media/setRouterApiMediaDelete');
const setRouterApiLogin = require('../controller/router/user/setRouterApiLogin');
const setRouterApiLogout = require('../controller/router/user/setRouterApiLogout');
const setRouterRootGet = require('../controller/router/screen/setRouterRootGet');
const setRouterScreenEntryGet = require('../controller/router/screen/setRouterScreenEntryGet');
const setRouterScreenDetailGet = require('../controller/router/screen/setRouterScreenDetailGet');
const setRouterScreenEditGet = require('../controller/router/screen/setRouterScreenEditGet');
const setRouterScreenErrorGet = require('../controller/router/screen/setRouterScreenErrorGet');
const setRouterScreenFavoriteGet = require('../controller/router/screen/setRouterScreenFavoriteGet');
const setRouterScreenLoginGet = require('../controller/router/screen/setRouterScreenLoginGet');
const setRouterScreenQueueGet = require('../controller/router/screen/setRouterScreenQueueGet');
const setRouterScreenSearchGet = require('../controller/router/screen/setRouterScreenSearchGet');
const setRouterScreenSummaryGet = require('../controller/router/screen/setRouterScreenSummaryGet');
const setRouterScreenViewerGet = require('../controller/router/screen/setRouterScreenViewerGet');
const setRouterApiFavoriteAndQueue = require('../controller/router/user/setRouterApiFavoriteAndQueue');
const InMemorySessionStateStore = require('../infrastructure/InMemorySessionStateStore');
const InMemoryLoginAttemptStore = require('../infrastructure/InMemoryLoginAttemptStore');
const RedisSessionStateStore = require('../infrastructure/RedisSessionStateStore');
const RedisLoginAttemptStore = require('../infrastructure/RedisLoginAttemptStore');
const createRedisClient = require('../infrastructure/createRedisClient');
const MulterDiskStorageContentUploadAdapter = require('../infrastructure/MulterDiskStorageContentUploadAdapter');
const SequelizeMediaRepository = require('../infrastructure/SequelizeMediaRepository');
const SequelizeMediaQueryRepository = require('../infrastructure/SequelizeMediaQueryRepository');
const SequelizeUserRepository = require('../infrastructure/SequelizeUserRepository');
const SequelizeUnitOfWork = require('../infrastructure/SequelizeUnitOfWork');
const SessionStateAuthAdapter = require('../infrastructure/SessionStateAuthAdapter');
const SessionStateRegistrar = require('../infrastructure/SessionStateRegistrar');
const SessionTerminator = require('../infrastructure/SessionTerminator');
const StaticLoginAuthenticator = require('../infrastructure/StaticLoginAuthenticator');
const UUIDMediaIdValueGenerator = require('../infrastructure/UUIDMediaIdValueGenerator');
const { SearchMediaService } = require('../application/media/query/SearchMediaService');
const { GetMediaDetailService } = require('../application/media/query/GetMediaDetailService');
const { GetMediaContentWithNavigationService } = require('../application/media/query/GetMediaContentWithNavigationService');
const { GetFavoriteSummariesService } = require('../application/user/query/GetFavoriteSummariesService');
const { GetQueueService } = require('../application/user/query/GetQueueService');
const { AddFavoriteService } = require('../application/user/command/AddFavoriteService');
const { RemoveFavoriteService } = require('../application/user/command/RemoveFavoriteService');
const { AddQueueService } = require('../application/user/command/AddQueueService');
const { RemoveQueueService } = require('../application/user/command/RemoveQueueService');
const { UpdateMediaService } = require('../application/media/command/UpdateMediaService');
const { DeleteMediaService } = require('../application/media/command/DeleteMediaService');
const { LoginService } = require('../application/user/command/LoginService');
const { LogoutService } = require('../application/user/command/LogoutService');
const { AppLogger } = require('../shared/AppLogger');
const { hasDevelopmentSession } = require('./developmentSession');

const ensureParentDirectory = targetPath => {
  const directory = path.dirname(targetPath);
  fs.mkdirSync(directory, { recursive: true });
};

const ensureDirectory = targetPath => {
  fs.mkdirSync(targetPath, { recursive: true });
};

const parseLogOutputs = value => String(value || '')
  .split(',')
  .map(entry => entry.trim())
  .filter(entry => entry.length > 0);

const isConfiguredValue = value => String(value || '').trim().length > 0;
const assertRequiredSecurityConfiguration = env => {
  if (!isConfiguredValue(env.appOrigin)) {
    const error = new Error('APP_ORIGIN の設定が不足しています');
    error.code = 'APP_ORIGIN_REQUIRED';
    throw error;
  }
};

const resolveLoginHashOptions = env => ({
  memoryCost: env.loginHashMemoryCost,
  iterations: env.loginHashIterations,
  parallelism: env.loginHashParallelism,
  timeCost: env.loginHashTimeCost,
});

const resolveLoginAuthConfig = env => {
  const isProduction = String(env.nodeEnv || '').toLowerCase() === 'production';
  const isAllowedInsecureDefaultLogin = String(env.allowInsecureDefaultLogin || '').toLowerCase() === 'true';
  if (isAllowedInsecureDefaultLogin) {
    const error = new Error('ALLOW_INSECURE_DEFAULT_LOGIN=true は許可できません');
    error.code = 'INSECURE_DEFAULT_LOGIN_DISALLOWED';
    throw error;
  }

  const rawConfig = {
    username: String(env.loginUserId || '').trim(),
    password: String(env.loginPassword || '').trim(),
    passwordHash: String(env.loginPasswordHash || '').trim(),
    userId: String(env.loginUserId || '').trim(),
  };
  const missingKeys = [
    !isConfiguredValue(rawConfig.userId) ? 'userId' : null,
    !isConfiguredValue(rawConfig.password) && !isConfiguredValue(rawConfig.passwordHash)
      ? 'password/passwordHash'
      : null,
  ].filter(Boolean);

  if (!isAllowedInsecureDefaultLogin && missingKeys.length > 0) {
    throw new Error([
      'ログイン認証設定が不足しています',
      `missing=${missingKeys.join(',')}`,
      '必要な設定: LOGIN_USER_ID(or FIXED_LOGIN_USER_ID), LOGIN_PASSWORDまたはLOGIN_PASSWORD_HASH',
    ].join(': '));
  }

  if (isProduction && isConfiguredValue(rawConfig.password)) {
    const weakPasswords = new Set([
      'admin',
      'password',
      'password123',
      '123456',
      '12345678',
      'qwerty',
    ]);
    const lowerUsername = rawConfig.username.toLowerCase();
    const lowerPassword = rawConfig.password.toLowerCase();
    const isWeakPassword = weakPasswords.has(lowerPassword) || lowerPassword === lowerUsername;
    if (isWeakPassword) {
      throw new Error('ログイン認証設定が脆弱です: 既知の弱いパスワードは使用できません');
    }
  }

  return {
    username: rawConfig.username,
    password: rawConfig.password,
    passwordHash: rawConfig.passwordHash,
    userId: rawConfig.userId,
    isUsingDefaultCredentials: false,
    isInsecureDefaultLoginEnabled: false,
  };
};


const resolveStoreBackend = env => {
  const backend = String(env.authStateStoreBackend || 'memory').trim().toLowerCase();
  return backend === 'redis' ? 'redis' : 'memory';
};

const createAuthStateStores = ({ env, logger }) => {
  const backend = resolveStoreBackend(env);
  if (backend !== 'redis') {
    return {
      backend,
      redisClient: null,
      sessionStateStore: new InMemorySessionStateStore(),
      loginAttemptStore: new InMemoryLoginAttemptStore(),
      ready: async () => {},
      close: async () => {},
    };
  }

  const redisClient = createRedisClient({
    url: env.redisUrl,
  });

  redisClient.on('error', error => {
    logger?.error('auth.store.redis.error', {
      reason: error?.message,
      error,
    });
  });

  return {
    backend,
    redisClient,
    sessionStateStore: new RedisSessionStateStore({
      redis: redisClient,
      keyPrefix: env.redisSessionKeyPrefix || 'session',
    }),
    loginAttemptStore: new RedisLoginAttemptStore({
      redis: redisClient,
      keyPrefix: env.redisAuthKeyPrefix || 'auth',
      defaultWindowMs: env.loginRateLimitWindowMs || 60_000,
      failureStateTtlMs: env.loginFailureStateTtlMs || 86_400_000,
    }),
    ready: async () => {
      await redisClient.connect();
      logger?.info('auth.store.redis.connected', {
        backend: 'redis',
      });
    },
    close: async () => {
      if (redisClient.isOpen) {
        await redisClient.quit();
      }
    },
  };
};

const createSequelize = env => new Sequelize({
  dialect: 'sqlite',
  storage: env.databaseStoragePath,
  logging: false,
});

const createDependencies = (env = {}) => {
  ensureParentDirectory(env.databaseStoragePath);
  ensureDirectory(env.contentRootDirectory);
  const resolvedLogFilePath = env.logFilePath || path.join(process.cwd(), 'var', 'logs', 'mangaviewer.log');
  ensureParentDirectory(resolvedLogFilePath);

  const logOutputs = parseLogOutputs(env.logOutputs);
  const logger = new AppLogger({
    level: env.logLevel || 'INFO',
    filePath: resolvedLogFilePath,
    outputs: logOutputs.length > 0 ? logOutputs : ['console', 'file'],
  });

  const sequelize = createSequelize(env);

  const unitOfWork = new SequelizeUnitOfWork({ sequelize });
  const mediaRepository = new SequelizeMediaRepository({
    sequelize,
    unitOfWorkContext: unitOfWork,
  });
  const authStateStores = createAuthStateStores({ env, logger });
  const sessionStateStore = authStateStores.sessionStateStore;
  const loginAttemptStore = authStateStores.loginAttemptStore;
  const mediaQueryRepository = new SequelizeMediaQueryRepository({ sequelize });
  const userRepository = new SequelizeUserRepository({
    sequelize,
    unitOfWorkContext: unitOfWork,
  });
  const searchMediaService = new SearchMediaService({ mediaQueryRepository });
  const getMediaDetailService = new GetMediaDetailService({ mediaRepository });
  const getMediaContentWithNavigationService = new GetMediaContentWithNavigationService({ mediaRepository });
  const getFavoriteSummariesService = new GetFavoriteSummariesService({ userRepository, mediaQueryRepository });
  const getQueueService = new GetQueueService({ userRepository, mediaQueryRepository });
  const addFavoriteService = new AddFavoriteService({ mediaRepository, userRepository, unitOfWork });
  const removeFavoriteService = new RemoveFavoriteService({ userRepository, unitOfWork });
  const addQueueService = new AddQueueService({ mediaRepository, userRepository, unitOfWork });
  const removeQueueService = new RemoveQueueService({ userRepository, unitOfWork });
  const sessionStateRegistrar = new SessionStateRegistrar({ sessionStateStore });
  const sessionTerminator = new SessionTerminator({ sessionStateStore });
  const loginAuthConfig = resolveLoginAuthConfig(env);
  const loginAuthenticator = new StaticLoginAuthenticator({
    username: loginAuthConfig.username,
    password: loginAuthConfig.password,
    passwordHash: loginAuthConfig.passwordHash,
    userId: loginAuthConfig.userId,
    hashOptions: resolveLoginHashOptions(env),
    onPasswordHashUpgrade: async ({ username, userId }) => {
      logger.warn('旧SHA-256ハッシュでの認証に成功したため再ハッシュが必要です。固定ユーザー認証の保存先更新を実装してください。', {
        username,
        userId,
      });
    },
  });
  const updateMediaService = new UpdateMediaService({ mediaRepository, unitOfWork });
  const deleteMediaService = new DeleteMediaService({ mediaRepository, unitOfWork });
  const loginService = new LoginService({
    loginAuthenticator,
    sessionStateRegistrar,
    sessionTtlMs: env.loginSessionTtlMs || 86_400_000,
  });
  const logoutService = new LogoutService({
    sessionTerminator,
  });

  const seedDevelopmentSession = async () => {
    if (!hasDevelopmentSession(env)) {
      return;
    }

    await sessionStateStore.save({
      sessionToken: env.devSessionToken,
      userId: env.devSessionUserId,
      ttlMs: env.devSessionTtlMs,
    });
  };

  const dependencies = {
    sequelize,
    unitOfWork,
    mediaRepository,
    mediaQueryRepository,
    userRepository,
    searchMediaService,
    getMediaDetailService,
    getMediaContentWithNavigationService,
    getFavoriteSummariesService,
    getQueueService,
    addFavoriteService,
    removeFavoriteService,
    addQueueService,
    removeQueueService,
    sessionStateStore,
    loginAttemptStore,
    sessionStateRegistrar,
    sessionTerminator,
    loginAuthenticator,
    updateMediaService,
    deleteMediaService,
    loginService,
    logoutService,
    logger,
    authStateStoreBackend: authStateStores.backend,
    authResolver: new SessionStateAuthAdapter({
      sessionStateStore,
    }),
    saveAdapter: new MulterDiskStorageContentUploadAdapter({
      rootDirectory: env.contentRootDirectory,
    }),
    mediaIdValueGenerator: new UUIDMediaIdValueGenerator(),
    routeSetters: {
      setRouterApiMediaPost,
      setRouterApiMediaPatch,
      setRouterApiMediaDelete,
      setRouterApiLogin,
      setRouterApiLogout,
      setRouterRootGet,
      setRouterScreenEntryGet,
      setRouterScreenDetailGet,
      setRouterScreenEditGet,
      setRouterScreenErrorGet,
      setRouterScreenFavoriteGet,
      setRouterScreenLoginGet,
      setRouterScreenQueueGet,
      setRouterScreenSearchGet,
      setRouterScreenSummaryGet,
      setRouterScreenViewerGet,
      setRouterApiFavoriteAndQueue,
    },
  };

  dependencies.ready = Promise.all([
    mediaRepository.sync(),
    authStateStores.ready(),
  ]).then(seedDevelopmentSession);
  dependencies.close = async () => {
    await dependencies.ready;
    await authStateStores.close();
    await sequelize.close();
  };

  return dependencies;
};

module.exports = createDependencies;
module.exports.resolveLoginAuthConfig = resolveLoginAuthConfig;
module.exports.assertRequiredSecurityConfiguration = assertRequiredSecurityConfiguration;
