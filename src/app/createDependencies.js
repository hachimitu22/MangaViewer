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

const ensureParentDirectory = targetPath => fs.mkdirSync(path.dirname(targetPath), { recursive: true });
const ensureDirectory = targetPath => fs.mkdirSync(targetPath, { recursive: true });
const parseLogOutputs = value => String(value || '').split(',').map(v => v.trim()).filter(Boolean);
const assertRequiredSecurityConfiguration = () => {};

const createDependencies = (env = {}) => {
  ensureParentDirectory(env.databaseStoragePath);
  ensureDirectory(env.contentRootDirectory);
  const resolvedLogFilePath = env.logFilePath || path.join(process.cwd(), 'var', 'logs', 'mangaviewer.log');
  ensureParentDirectory(resolvedLogFilePath);

  const logger = new AppLogger({
    level: env.logLevel || 'INFO',
    filePath: resolvedLogFilePath,
    outputs: parseLogOutputs(env.logOutputs).length > 0 ? parseLogOutputs(env.logOutputs) : ['console', 'file'],
  });

  const sequelize = new Sequelize({ dialect: 'sqlite', storage: env.databaseStoragePath, logging: false });
  const unitOfWork = new SequelizeUnitOfWork({ sequelize });
  const mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
  const mediaQueryRepository = new SequelizeMediaQueryRepository({ sequelize });

  const dependencies = {
    sequelize,
    unitOfWork,
    mediaRepository,
    mediaQueryRepository,
    searchMediaService: new SearchMediaService({ mediaQueryRepository }),
    getMediaDetailService: new GetMediaDetailService({ mediaRepository }),
    getMediaContentWithNavigationService: new GetMediaContentWithNavigationService({ mediaRepository }),
    updateMediaService: new UpdateMediaService({ mediaRepository, unitOfWork }),
    deleteMediaService: new DeleteMediaService({ mediaRepository, unitOfWork }),
    logger,
    saveAdapter: new MulterDiskStorageContentUploadAdapter({ rootDirectory: env.contentRootDirectory }),
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
  dependencies.close = async () => sequelize.close();
  return dependencies;
};

module.exports = createDependencies;
module.exports.assertRequiredSecurityConfiguration = assertRequiredSecurityConfiguration;
module.exports.resolveLoginAuthConfig = () => ({});
