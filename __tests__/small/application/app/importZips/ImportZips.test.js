const { ImportZips, Query } = require('../../../../../src/application/app/importZips/ImportZips');
const { RegisterMediaServiceInput } = require('../../../../../src/application/media/command/RegisterMediaService');

const createDeps = () => ({
  fileAccess: {
    inspectTarget: jest.fn().mockResolvedValue({
      hasArg: true,
      exists: true,
      readable: true,
      isDirectory: true,
    }),
    listDirectEntries: jest.fn().mockResolvedValue([]),
  },
  zipHandler: {
    listEntries: jest.fn(),
  },
  contentStorage: {
    saveFromZipEntries: jest.fn().mockResolvedValue([]),
  },
  registerMediaService: {
    execute: jest.fn().mockResolvedValue({ mediaId: 'media-1' }),
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
});

describe('ImportZips (small)', () => {
  test('事前チェック失敗時は終了コード3/4を返し、zip処理を開始しない', async () => {
    const deps = createDeps();
    deps.fileAccess.inspectTarget.mockResolvedValue({
      hasArg: false,
      exists: false,
      readable: false,
      isDirectory: false,
    });

    const sut = new ImportZips(deps);
    const result = await sut.execute(new Query({ targetDir: '' }));

    expect(result).toEqual({
      exitCode: 3,
      totalZipCount: 0,
      successCount: 0,
      failureCount: 0,
    });
    expect(deps.fileAccess.listDirectEntries).not.toHaveBeenCalled();
    expect(deps.logger.error).toHaveBeenCalledWith(
      'import_zips.precheck_failed',
      expect.objectContaining({ reason: 'missing-arg' }),
    );
  });

  test('zipが0件なら終了コード0を返す', async () => {
    const deps = createDeps();
    deps.fileAccess.listDirectEntries.mockResolvedValue([
      { name: 'README.md', path: '/tmp/README.md' },
      { name: 'assets', path: '/tmp/assets' },
    ]);

    const sut = new ImportZips(deps);
    const result = await sut.execute(new Query({ targetDir: '/tmp' }));

    expect(result).toEqual({
      exitCode: 0,
      totalZipCount: 0,
      successCount: 0,
      failureCount: 0,
    });
    expect(deps.logger.info).toHaveBeenCalledWith('import_zips.skip_non_zip', { entryName: 'README.md' });
    expect(deps.logger.info).toHaveBeenCalledWith('import_zips.skip_non_zip', { entryName: 'assets' });
  });

  test('zip内の有効画像をbasename自然順で登録し、成功をカウントする', async () => {
    const deps = createDeps();
    deps.fileAccess.listDirectEntries.mockResolvedValue([
      { name: 'my.book.v1.zip', path: '/tmp/my.book.v1.zip' },
    ]);
    deps.zipHandler.listEntries.mockResolvedValue([
      { name: '10.jpeg' },
      { name: '2.jpeg' },
      { name: '1.jpeg' },
      { name: 'pages/99.jpeg' },
      { name: 'memo.txt' },
    ]);
    deps.contentStorage.saveFromZipEntries.mockResolvedValue(['c1', 'c2', 'c3']);

    const sut = new ImportZips(deps);
    const result = await sut.execute(new Query({ targetDir: '/tmp' }));

    expect(deps.contentStorage.saveFromZipEntries).toHaveBeenCalledWith({
      zipPath: '/tmp/my.book.v1.zip',
      entryNames: ['1.jpeg', '2.jpeg', '10.jpeg'],
    });
    expect(deps.registerMediaService.execute).toHaveBeenCalledWith(expect.any(RegisterMediaServiceInput));
    expect(deps.registerMediaService.execute.mock.calls[0][0]).toMatchObject({
      title: 'my.book.v1',
      contents: ['c1', 'c2', 'c3'],
      tags: [],
      priorityCategories: [],
    });
    expect(result).toEqual({
      exitCode: 0,
      totalZipCount: 1,
      successCount: 1,
      failureCount: 0,
    });
  });

  test('有効画像が0件のzipは失敗として継続する', async () => {
    const deps = createDeps();
    deps.fileAccess.listDirectEntries.mockResolvedValue([
      { name: 'empty.zip', path: '/tmp/empty.zip' },
      { name: 'ok.zip', path: '/tmp/ok.zip' },
    ]);

    deps.zipHandler.listEntries
      .mockResolvedValueOnce([{ name: 'readme.txt' }])
      .mockResolvedValueOnce([{ name: '1.jpg' }]);

    deps.contentStorage.saveFromZipEntries.mockResolvedValue(['cid-1']);

    const sut = new ImportZips(deps);
    const result = await sut.execute(new Query({ targetDir: '/tmp' }));

    expect(result).toEqual({
      exitCode: 1,
      totalZipCount: 2,
      successCount: 1,
      failureCount: 1,
    });
    expect(deps.logger.warn).toHaveBeenCalledWith('import_zips.no_supported_images', { zipName: 'empty.zip' });
  });

  test('zip処理で例外が発生しても失敗として継続する', async () => {
    const deps = createDeps();
    deps.fileAccess.listDirectEntries.mockResolvedValue([
      { name: 'broken.zip', path: '/tmp/broken.zip' },
      { name: 'ok.zip', path: '/tmp/ok.zip' },
    ]);

    deps.zipHandler.listEntries
      .mockRejectedValueOnce(new Error('broken zip'))
      .mockResolvedValueOnce([{ name: '1.jpg' }]);
    deps.contentStorage.saveFromZipEntries.mockResolvedValue(['cid-ok']);

    const sut = new ImportZips(deps);
    const result = await sut.execute(new Query({ targetDir: '/tmp' }));

    expect(result).toEqual({
      exitCode: 1,
      totalZipCount: 2,
      successCount: 1,
      failureCount: 1,
    });
    expect(deps.logger.error).toHaveBeenCalledWith(
      'import_zips.failure',
      expect.objectContaining({ zipName: 'broken.zip', error: 'broken zip' }),
    );
  });
});
