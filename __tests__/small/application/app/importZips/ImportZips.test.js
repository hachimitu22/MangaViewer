const ImportZipsPolicy = require('../../../../../src/application/app/importZips/ImportZipsPolicy');

describe('ImportZips (small) - testcase.small.md 準拠', () => {
  describe('拡張子判定', () => {
    test('S-EXT-01: `.jpg` は画像として受理する', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.jpg')).toBe(true);
    });

    test('S-EXT-02: `.jpeg` は画像として受理する', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.jpeg')).toBe(true);
    });

    test('S-EXT-03: `.png` は画像として受理する', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.png')).toBe(true);
    });

    test('S-EXT-04: `.gif` は画像として受理する', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.gif')).toBe(true);
    });

    test('S-EXT-05: `.webp` は画像として受理する', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.webp')).toBe(true);
    });

    test('S-EXT-06: 許可外拡張子（`.bmp`）は画像として扱わない', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.bmp')).toBe(false);
    });

    test('S-EXT-07: 許可拡張子は大文字小文字を区別せず受理する', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('A.JPG')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('B.JPEG')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('C.PnG')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('D.GIF')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('E.WeBp')).toBe(true);
    });

    test('S-EXT-08: 許可外拡張子は画像として扱わない', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.bmp')).toBe(false);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.avif')).toBe(false);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.txt')).toBe(false);
    });

    test('S-EXT-09: 拡張子なしは画像として扱わない', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample')).toBe(false);
    });
  });

  describe('zip 判定 / zip内エントリ判定', () => {
    test('S-ZIP-01: `.zip` は対象zipとして受理する', () => {
      expect(ImportZipsPolicy.isTargetZipFilename('book.zip')).toBe(true);
    });

    test('S-ZIP-02: `.ZIP` など大文字混在も対象zipとして受理する', () => {
      expect(ImportZipsPolicy.isTargetZipFilename('A.ZIP')).toBe(true);
      expect(ImportZipsPolicy.isTargetZipFilename('B.ZiP')).toBe(true);
    });

    test('S-ZIP-03: `.zipx` は対象zipとして扱わない', () => {
      expect(ImportZipsPolicy.isTargetZipFilename('book.zipx')).toBe(false);
    });

    test('S-ENTRY-01: zip内の直下ファイルは処理対象に含める', () => {
      expect(ImportZipsPolicy.isDirectZipEntry('1.jpeg')).toBe(true);
    });

    test('S-ENTRY-02: zip内ディレクトリ配下ファイルは処理対象から除外する', () => {
      expect(ImportZipsPolicy.isDirectZipEntry('pages/1.jpeg')).toBe(false);
    });
  });

  describe('順序決定', () => {
    test('S-SORT-01: basename 自然順で `1,2,10` になる', () => {
      expect(
        ImportZipsPolicy.sortEntryNamesByNaturalBasename(['10.jpeg', '2.jpeg', '1.jpeg']),
      ).toEqual(['1.jpeg', '2.jpeg', '10.jpeg']);
    });
  });

  describe('終了コード決定', () => {
    test('S-EXIT-01: 成功=0件・失敗=0件なら終了コード0', () => {
      expect(ImportZipsPolicy.decideExitCode({ successCount: 0, failureCount: 0 })).toBe(0);
    });

    test('S-EXIT-02: 成功あり・失敗なしなら終了コード0', () => {
      expect(ImportZipsPolicy.decideExitCode({ successCount: 1, failureCount: 0 })).toBe(0);
    });

    test('S-EXIT-03: 成功あり・失敗ありなら終了コード1', () => {
      expect(ImportZipsPolicy.decideExitCode({ successCount: 1, failureCount: 1 })).toBe(1);
    });

    test('S-EXIT-04: 成功なし・失敗ありなら終了コード2', () => {
      expect(ImportZipsPolicy.decideExitCode({ successCount: 0, failureCount: 1 })).toBe(2);
    });
  });

  describe('事前チェック判定', () => {
    test('S-PRE-01: 引数未指定は事前チェック失敗3', () => {
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: false,
        exists: false,
        readable: false,
        isDirectory: false,
      })).toEqual({ ok: false, exitCode: 3, reason: 'missing-arg' });
    });

    test('S-PRE-02: 対象dir不存在/読取不可は事前チェック失敗3', () => {
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: true,
        exists: false,
        readable: false,
        isDirectory: false,
      })).toEqual({ ok: false, exitCode: 3, reason: 'unreadable-target' });
    });

    test('S-PRE-03: 対象がファイルなら事前チェック失敗4', () => {
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: true,
        exists: true,
        readable: true,
        isDirectory: false,
      })).toEqual({ ok: false, exitCode: 4, reason: 'not-directory' });
    });
  });
});
