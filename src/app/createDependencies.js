const fs = require('fs');
const path = require('path');

const { Sequelize } = require('sequelize');

const setRouterApiMediaPost = require('../controller/router/media/setRouterApiMediaPost');
const InMemorySessionStateStore = require('../infrastructure/InMemorySessionStateStore');
const MulterDiskStorageContentUploadAdapter = require('../infrastructure/MulterDiskStorageContentUploadAdapter');
const SequelizeMediaRepository = require('../infrastructure/SequelizeMediaRepository');
const SequelizeUnitOfWork = require('../infrastructure/SequelizeUnitOfWork');
const SessionStateAuthAdapter = require('../infrastructure/SessionStateAuthAdapter');
const UUIDMediaIdValueGenerator = require('../infrastructure/UUIDMediaIdValueGenerator');

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

  const dependencies = {
    sequelize,
    unitOfWork,
    mediaRepository,
    sessionStateStore,
    authResolver: new SessionStateAuthAdapter({
      sessionStateStore,
    }),
    saveAdapter: new MulterDiskStorageContentUploadAdapter({
      rootDirectory: env.contentRootDirectory,
    }),
    mediaIdValueGenerator: new UUIDMediaIdValueGenerator(),
    routeSetters: {
      setRouterApiMediaPost,
    },
  };

  dependencies.ready = mediaRepository.sync();

  return dependencies;
};

module.exports = createDependencies;
