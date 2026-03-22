const fs = require('fs');
const path = require('path');

const { Sequelize } = require('sequelize');

const setRouterContentGet = require('../controller/router/content/setRouterContentGet');
const setRouterApiMediaPost = require('../controller/router/media/setRouterApiMediaPost');
const setRouterScreenEntryGet = require('../controller/router/screen/setRouterScreenEntryGet');
const setRouterScreenDetailGet = require('../controller/router/screen/setRouterScreenDetailGet');
const setRouterScreenErrorGet = require('../controller/router/screen/setRouterScreenErrorGet');
const setRouterScreenLoginGet = require('../controller/router/screen/setRouterScreenLoginGet');
const setRouterScreenSearchGet = require('../controller/router/screen/setRouterScreenSearchGet');
const setRouterScreenSummaryGet = require('../controller/router/screen/setRouterScreenSummaryGet');
const setRouterScreenViewerGet = require('../controller/router/screen/setRouterScreenViewerGet');
const InMemorySessionStateStore = require('../infrastructure/InMemorySessionStateStore');
const MulterDiskStorageContentUploadAdapter = require('../infrastructure/MulterDiskStorageContentUploadAdapter');
const SequelizeMediaRepository = require('../infrastructure/SequelizeMediaRepository');
const SequelizeMediaQueryRepository = require('../infrastructure/SequelizeMediaQueryRepository');
const SequelizeUnitOfWork = require('../infrastructure/SequelizeUnitOfWork');
const SessionStateAuthAdapter = require('../infrastructure/SessionStateAuthAdapter');
const UUIDMediaIdValueGenerator = require('../infrastructure/UUIDMediaIdValueGenerator');
const { SearchMediaService } = require('../application/media/query/SearchMediaService');
const { GetMediaDetailService } = require('../application/media/query/GetMediaDetailService');
const { GetMediaContentWithNavigationService } = require('../application/media/query/GetMediaContentWithNavigationService');
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
  const searchMediaService = new SearchMediaService({ mediaQueryRepository });
  const getMediaDetailService = new GetMediaDetailService({ mediaRepository });
  const getMediaContentWithNavigationService = new GetMediaContentWithNavigationService({ mediaRepository });

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
    searchMediaService,
    getMediaDetailService,
    getMediaContentWithNavigationService,
    sessionStateStore,
    authResolver: new SessionStateAuthAdapter({
      sessionStateStore,
    }),
    saveAdapter: new MulterDiskStorageContentUploadAdapter({
      rootDirectory: env.contentRootDirectory,
    }),
    mediaIdValueGenerator: new UUIDMediaIdValueGenerator(),
    routeSetters: {
      setRouterContentGet,
      setRouterApiMediaPost,
      setRouterScreenEntryGet,
      setRouterScreenDetailGet,
      setRouterScreenErrorGet,
      setRouterScreenLoginGet,
      setRouterScreenSearchGet,
      setRouterScreenSummaryGet,
      setRouterScreenViewerGet,
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
