const { ImportZips, Query } = require('../../../../../src/application/app/importZips/ImportZips');

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
    saveFromZipEntries: jest.fn(async ({ entryNames }) => entryNames.map((_, index) => `cid-${index + 1}`)),
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

describe('ImportZips / ImportZipsPolicy (medium)', () => {
  test('M-POLICY-01: ImportZips経路で`.jpg/.jpeg/.png/.gif/.webp`のみが画像として扱われる', async () => {
    const deps = createDeps();
    deps.fileAccess.listDirectEntries.mockResolvedValue([
      { name: 'images.zip', path: '/tmp/images.zip' },
    ]);
    deps.zipHandler.listEntries.mockResolvedValue([
      { name: 'a.JPG' },
      { name: 'b.jpeg' },
      { name: 'c.png' },
      { name: 'd.gif' },
      { name: 'e.webp' },
      { name: 'f.bmp' },
    ]);

    const sut = new ImportZips(deps);
    const result = await sut.execute(new Query({ targetDir: '/tmp' }));

    expect(deps.contentStorage.saveFromZipEntries).toHaveBeenCalledWith({
      zipPath: '/tmp/images.zip',
      entryNames: ['a.JPG', 'b.jpeg', 'c.png', 'd.gif', 'e.webp'],
    });
    expect(result).toEqual({
      exitCode: 0,
      totalZipCount: 1,
      successCount: 1,
      failureCount: 0,
    });
  });

  test('M-POLICY-02: zip拡張子判定は大文字小文字非区別で適用される', async () => {
    const deps = createDeps();
    deps.fileAccess.listDirectEntries.mockResolvedValue([
      { name: 'A.zip', path: '/tmp/A.zip' },
      { name: 'B.ZIP', path: '/tmp/B.ZIP' },
      { name: 'C.ZiP', path: '/tmp/C.ZiP' },
      { name: 'D.txt', path: '/tmp/D.txt' },
    ]);
    deps.zipHandler.listEntries.mockResolvedValue([{ name: '1.jpg' }]);

    const sut = new ImportZips(deps);
    const result = await sut.execute(new Query({ targetDir: '/tmp' }));

    expect(deps.zipHandler.listEntries).toHaveBeenCalledTimes(3);
    expect(deps.logger.info).toHaveBeenCalledWith('import_zips.skip_non_zip', { entryName: 'D.txt' });
    expect(result).toEqual({
      exitCode: 0,
      totalZipCount: 3,
      successCount: 3,
      failureCount: 0,
    });
  });

  test('M-POLICY-03: 成功件数/失敗件数の集計から終了コードが決定される', async () => {
    const deps = createDeps();
    deps.fileAccess.listDirectEntries.mockResolvedValue([
      { name: 'ok.zip', path: '/tmp/ok.zip' },
      { name: 'ng.zip', path: '/tmp/ng.zip' },
    ]);
    deps.zipHandler.listEntries
      .mockResolvedValueOnce([{ name: '1.jpg' }])
      .mockResolvedValueOnce([{ name: 'broken.txt' }]);

    const sut = new ImportZips(deps);
    const result = await sut.execute(new Query({ targetDir: '/tmp' }));

    expect(result).toEqual({
      exitCode: 1,
      totalZipCount: 2,
      successCount: 1,
      failureCount: 1,
    });
  });
});
