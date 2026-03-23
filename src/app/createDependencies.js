const fs = require('fs');
const path = require('path');

const { Sequelize } = require('sequelize');

const setRouterApiMediaPost = require('../controller/router/media/setRouterApiMediaPost');
const setRouterApiLogin = require('../controller/router/user/setRouterApiLogin');
const setRouterApiLogout = require('../controller/router/user/setRouterApiLogout');
const setRouterScreenEntryGet = require('../controller/router/screen/setRouterScreenEntryGet');
const setRouterScreenDetailGet = require('../controller/router/screen/setRouterScreenDetailGet');
const setRouterScreenEditGet = require('../controller/router/screen/setRouterScreenEditGet');
const setRouterScreenErrorGet = require('../controller/router/screen/setRouterScreenErrorGet');
const setRouterScreenFavoriteGet = require('../controller/router/screen/setRouterScreenFavoriteGet');
const setRouterScreenLoginGet = require('../controller/router/screen/setRouterScreenLoginGet');
const setRouterScreenSearchGet = require('../controller/router/screen/setRouterScreenSearchGet');
const setRouterScreenSummaryGet = require('../controller/router/screen/setRouterScreenSummaryGet');
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
const { GetFavoriteSummariesService } = require('../application/user/query/GetFavoriteSummariesService');
const { AddFavoriteService } = require('../application/user/command/AddFavoriteService');
const { RemoveFavoriteService } = require('../application/user/command/RemoveFavoriteService');
const { AddQueueService } = require('../application/user/command/AddQueueService');
const { RemoveQueueService } = require('../application/user/command/RemoveQueueService');
const { LoginService } = require('../application/user/command/LoginService');
const { LogoutService } = require('../application/user/command/LogoutService');
const { hasDevelopmentSession } = require('./developmentSession');

const ensureParentDirectory = targetPath => {
  const directory = path.dirname(targetPath);
  fs.mkdirSync(directory, { recursive: true });
};

const ensureDirectory = targetPath => {
  fs.mkdirSync(targetPath, { recursive: true });
};

const createDependencies = (env = {}) => {
  ensureParentDirectory(env.databaseStoragePath);
  ensureDirectory(env.contentRootDirectory);

  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: env.databaseStoragePath,
    logging: false,
  });

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
  const getFavoriteSummariesService = new GetFavoriteSummariesService({ userRepository, mediaQueryRepository });
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
    getFavoriteSummariesService,
    addFavoriteService,
    removeFavoriteService,
    addQueueService,
    removeQueueService,
    sessionStateStore,
    sessionStateRegistrar,
    sessionTerminator,
    loginAuthenticator,
    loginService,
    logoutService,
    authResolver: new SessionStateAuthAdapter({
      sessionStateStore,
    }),
    saveAdapter: new MulterDiskStorageContentUploadAdapter({
      rootDirectory: env.contentRootDirectory,
    }),
    mediaIdValueGenerator: new UUIDMediaIdValueGenerator(),
    routeSetters: {
      setRouterApiMediaPost,
      setRouterApiLogin,
      setRouterApiLogout,
      setRouterScreenEntryGet,
      setRouterScreenDetailGet,
      setRouterScreenEditGet,
      setRouterScreenErrorGet,
      setRouterScreenFavoriteGet,
      setRouterScreenLoginGet,
      setRouterScreenSearchGet,
      setRouterScreenSummaryGet,
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
