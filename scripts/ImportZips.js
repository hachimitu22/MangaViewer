const fs = require('fs');
const path = require('path');
const { RegisterMediaServiceInput } = require('../src/application/media/command/RegisterMediaService');
const ImportZipsPolicy = require('../src/application/app/importZips/ImportZipsPolicy');

class Query {
  constructor({ targetDir } = {}) {
    this.targetDir = targetDir;
  }
}

class ImportZips {
  #fileAccess;
  #zipHandler;
  #contentStorage;
  #registerMediaService;
  #logger;
  #policy;

  constructor({
    fileAccess,
    zipHandler,
    contentStorage,
    registerMediaService,
    logger,
    policy = ImportZipsPolicy,
  } = {}) {
    if (!fileAccess || typeof fileAccess.inspectTarget !== 'function' || typeof fileAccess.listDirectEntries !== 'function') {
      throw new Error('fileAccess.inspectTarget/listDirectEntries must be functions');
    }
    if (!zipHandler || typeof zipHandler.listEntries !== 'function') {
      throw new Error('zipHandler.listEntries must be a function');
    }
    if (!contentStorage || typeof contentStorage.saveFromZipEntries !== 'function') {
      throw new Error('contentStorage.saveFromZipEntries must be a function');
    }
    if (!registerMediaService || typeof registerMediaService.execute !== 'function') {
      throw new Error('registerMediaService.execute must be a function');
    }
    if (!logger || typeof logger.info !== 'function' || typeof logger.warn !== 'function' || typeof logger.error !== 'function') {
      throw new Error('logger.info/warn/error must be functions');
    }
    if (!policy
      || typeof policy.isSupportedImageExtension !== 'function'
      || typeof policy.isTargetZipFilename !== 'function'
      || typeof policy.isDirectZipEntry !== 'function'
      || typeof policy.sortEntryNamesByNaturalBasename !== 'function'
      || typeof policy.decideExitCode !== 'function'
      || typeof policy.validateImportTarget !== 'function') {
      throw new Error('policy must provide ImportZipsPolicy public APIs');
    }

    this.#fileAccess = fileAccess;
    this.#zipHandler = zipHandler;
    this.#contentStorage = contentStorage;
    this.#registerMediaService = registerMediaService;
    this.#logger = logger;
    this.#policy = policy;
  }

  async execute(query = new Query()) {
    if (!(query instanceof Query)) {
      throw new Error('query must be an instance of Query');
    }

    const inspected = await this.#fileAccess.inspectTarget(query.targetDir);
    const precheck = this.#policy.validateImportTarget(inspected);
    if (!precheck.ok) {
      this.#logger.error('import_zips.precheck_failed', {
        targetDir: query.targetDir,
        reason: precheck.reason,
      });
      return {
        exitCode: precheck.exitCode,
        totalZipCount: 0,
        successCount: 0,
        failureCount: 0,
      };
    }

    const entries = await this.#fileAccess.listDirectEntries(query.targetDir);
    const zipEntries = entries.filter(entry => this.#policy.isTargetZipFilename(entry?.name));

    let successCount = 0;
    let failureCount = 0;

    for (const entry of entries) {
      if (!this.#policy.isTargetZipFilename(entry?.name)) {
        this.#logger.info('import_zips.skip_non_zip', { entryName: entry?.name || '' });
        continue;
      }

      const zipName = entry.name;
      try {
        const listedEntries = await this.#zipHandler.listEntries(entry.path);

        const supportedEntryNames = listedEntries
          .filter(zipEntry => this.#policy.isDirectZipEntry(zipEntry.name))
          .map(zipEntry => zipEntry.name)
          .filter(name => this.#policy.isSupportedImageExtension(name));

        if (supportedEntryNames.length === 0) {
          failureCount += 1;
          this.#logger.warn('import_zips.no_supported_images', { zipName });
          continue;
        }

        const sortedEntryNames = this.#policy.sortEntryNamesByNaturalBasename(supportedEntryNames);
        const contentIds = await this.#contentStorage.saveFromZipEntries({
          zipPath: entry.path,
          entryNames: sortedEntryNames,
        });

        const title = path.basename(zipName, path.extname(zipName));
        const registerInput = new RegisterMediaServiceInput({
          title,
          contents: contentIds,
          tags: [],
          priorityCategories: [],
        });
        const registerResult = await this.#registerMediaService.execute(registerInput);

        successCount += 1;
        this.#logger.info('import_zips.success', {
          zipName,
          mediaId: registerResult?.mediaId || null,
          contentCount: Array.isArray(contentIds) ? contentIds.length : 0,
        });
      } catch (error) {
        failureCount += 1;
        this.#logger.error('import_zips.failure', {
          zipName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      exitCode: this.#policy.decideExitCode({ successCount, failureCount }),
      totalZipCount: zipEntries.length,
      successCount,
      failureCount,
    };
  }
}

const runFromCommandLine = async () => {
  const targetDir = process.argv[2];
  const app = new ImportZips({
    fileAccess: {
      async inspectTarget(dir) {
        if (!(typeof dir === 'string' && dir.length > 0)) {
          return { hasArg: false, exists: false, readable: false, isDirectory: false };
        }
        try {
          const stats = await fs.promises.stat(dir);
          return { hasArg: true, exists: true, readable: true, isDirectory: stats.isDirectory() };
        } catch (_error) {
          return { hasArg: true, exists: false, readable: false, isDirectory: false };
        }
      },
      async listDirectEntries(dir) {
        const names = await fs.promises.readdir(dir);
        return names.map(name => ({ name, path: path.join(dir, name) }));
      },
    },
    zipHandler: { async listEntries() { return []; } },
    contentStorage: { async saveFromZipEntries() { return []; } },
    registerMediaService: { async execute() { return { mediaId: null }; } },
    logger: console,
  });

  const result = await app.execute(new Query({ targetDir }));
  process.exitCode = result.exitCode;
};

if (require.main === module) {
  runFromCommandLine();
}

module.exports = {
  Query,
  ImportZips,
  runFromCommandLine,
};
