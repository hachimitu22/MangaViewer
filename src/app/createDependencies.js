const fs = require('fs');
const path = require('path');

const { Sequelize } = require('sequelize');

const setRouterApiMediaPost = require('../controller/router/media/setRouterApiMediaPost');
const setRouterApiMediaPatch = require('../controller/router/media/setRouterApiMediaPatch');
const setRouterApiMediaDelete = require('../controller/router/media/setRouterApiMediaDelete');
const setRouterApiLogin = require('../controller/router/user/setRouterApiLogin');
const setRouterApiLogout = require('../controller/router/user/setRouterApiLogout');
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

const createSequelize = env => {
  if (env.databaseDialect === 'postgres') {
    if (env.databaseUrl) {
      return new Sequelize(env.databaseUrl, {
        dialect: 'postgres',
        logging: false,
      });
    }

    return new Sequelize({
      dialect: 'postgres',
      host: env.databaseHost || 'db',
      port: env.databasePort || 5432,
      database: env.databaseName || 'mangaviewer',
      username: env.databaseUsername || 'mangaviewer',
      password: env.databasePassword || 'mangaviewer',
      logging: false,
    });
  }

  return new Sequelize({
    dialect: 'sqlite',
    storage: env.databaseStoragePath,
    logging: false,
  });
};

const createDependencies = (env = {}) => {
  if (env.databaseDialect !== 'postgres') {
    ensureParentDirectory(env.databaseStoragePath);
  }
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
  const sessionStateStore = new InMemorySessionStateStore();
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
  const loginAuthenticator = new StaticLoginAuthenticator({
    username: env.loginUsername || 'admin',
    password: env.loginPassword || 'admin',
    userId: env.loginUserId || 'admin',
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

  if (hasDevelopmentSession(env)) {
    sessionStateStore.save({
      sessionToken: env.devSessionToken,
      userId: env.devSessionUserId,
      ttlMs: env.devSessionTtlMs,
    });
  }

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
    sessionStateRegistrar,
    sessionTerminator,
    loginAuthenticator,
    updateMediaService,
    deleteMediaService,
    loginService,
    logoutService,
    logger,
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

  dependencies.ready = mediaRepository.sync();
  dependencies.close = async () => {
    await dependencies.ready;
    await sequelize.close();
  };

  return dependencies;
};

module.exports = createDependencies;
