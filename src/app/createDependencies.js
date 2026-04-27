const fs = require('fs');
const path = require('path');

const { Sequelize } = require('sequelize');

const setRouterApiMediaPost = require('../controller/router/media/setRouterApiMediaPost');
const setRouterApiMediaPatch = require('../controller/router/media/setRouterApiMediaPatch');
const setRouterApiMediaDelete = require('../controller/router/media/setRouterApiMediaDelete');
const setRouterRootGet = require('../controller/router/screen/setRouterRootGet');
const setRouterScreenEntryGet = require('../controller/router/screen/setRouterScreenEntryGet');
const setRouterScreenDetailGet = require('../controller/router/screen/setRouterScreenDetailGet');
const setRouterScreenEditGet = require('../controller/router/screen/setRouterScreenEditGet');
const setRouterScreenErrorGet = require('../controller/router/screen/setRouterScreenErrorGet');
const setRouterScreenSearchGet = require('../controller/router/screen/setRouterScreenSearchGet');
const setRouterScreenSummaryGet = require('../controller/router/screen/setRouterScreenSummaryGet');
const setRouterScreenViewerGet = require('../controller/router/screen/setRouterScreenViewerGet');
const MulterDiskStorageContentUploadAdapter = require('../infrastructure/MulterDiskStorageContentUploadAdapter');
const SequelizeMediaRepository = require('../infrastructure/SequelizeMediaRepository');
const SequelizeMediaQueryRepository = require('../infrastructure/SequelizeMediaQueryRepository');
const SequelizeUnitOfWork = require('../infrastructure/SequelizeUnitOfWork');
const UUIDMediaIdValueGenerator = require('../infrastructure/UUIDMediaIdValueGenerator');
const { SearchMediaService } = require('../application/media/query/SearchMediaService');
const { GetMediaDetailService } = require('../application/media/query/GetMediaDetailService');
const { GetMediaContentWithNavigationService } = require('../application/media/query/GetMediaContentWithNavigationService');
const { UpdateMediaService } = require('../application/media/command/UpdateMediaService');
const { DeleteMediaService } = require('../application/media/command/DeleteMediaService');
const { AppLogger } = require('../shared/AppLogger');

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
  const mediaQueryRepository = new SequelizeMediaQueryRepository({ sequelize });
  const searchMediaService = new SearchMediaService({ mediaQueryRepository });
  const getMediaDetailService = new GetMediaDetailService({ mediaRepository });
  const getMediaContentWithNavigationService = new GetMediaContentWithNavigationService({ mediaRepository });
  const updateMediaService = new UpdateMediaService({ mediaRepository, unitOfWork });
  const deleteMediaService = new DeleteMediaService({ mediaRepository, unitOfWork });

  const dependencies = {
    sequelize,
    unitOfWork,
    mediaRepository,
    mediaQueryRepository,
    searchMediaService,
    getMediaDetailService,
    getMediaContentWithNavigationService,
    updateMediaService,
    deleteMediaService,
    logger,
    saveAdapter: new MulterDiskStorageContentUploadAdapter({
      rootDirectory: env.contentRootDirectory,
    }),
    mediaIdValueGenerator: new UUIDMediaIdValueGenerator(),
    routeSetters: {
      setRouterApiMediaPost,
      setRouterApiMediaPatch,
      setRouterApiMediaDelete,
      setRouterRootGet,
      setRouterScreenEntryGet,
      setRouterScreenDetailGet,
      setRouterScreenEditGet,
      setRouterScreenErrorGet,
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
module.exports.assertRequiredSecurityConfiguration = assertRequiredSecurityConfiguration;
