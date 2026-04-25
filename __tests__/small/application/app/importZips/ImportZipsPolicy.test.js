const ImportZipsPolicy = require('../../../../../src/application/app/importZips/ImportZipsPolicy');

describe('ImportZipsPolicy (small)', () => {
  test('公開API: 必要な関数を公開する', () => {
    expect(typeof ImportZipsPolicy.isSupportedImageExtension).toBe('function');
    expect(typeof ImportZipsPolicy.isTargetZipFilename).toBe('function');
    expect(typeof ImportZipsPolicy.isDirectZipEntry).toBe('function');
    expect(typeof ImportZipsPolicy.sortEntryNamesByNaturalBasename).toBe('function');
    expect(typeof ImportZipsPolicy.decideExitCode).toBe('function');
    expect(typeof ImportZipsPolicy.validateImportTarget).toBe('function');
  });

  describe('isSupportedImageExtension', () => {
    test('.jpg を受理する', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.jpg')).toBe(true);
    });

    test('.jpeg を受理する', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.jpeg')).toBe(true);
    });

    test('.png/.gif/.webp を受理する', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.png')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.gif')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.webp')).toBe(true);
    });

    test('許可拡張子は大文字小文字を区別しない', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('A.JPG')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('B.JPEG')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('C.PnG')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('D.GIF')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('E.WeBp')).toBe(true);
    });

    test('非許可拡張子（.bmp/.avif/.txt）と拡張子なしを拒否する', () => {
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.bmp')).toBe(false);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.avif')).toBe(false);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.txt')).toBe(false);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample')).toBe(false);
    });
  });

  describe('isTargetZipFilename', () => {
    test('.zip を受理する', () => {
      expect(ImportZipsPolicy.isTargetZipFilename('book.zip')).toBe(true);
    });

    test('.ZIP など大文字混在も受理する', () => {
      expect(ImportZipsPolicy.isTargetZipFilename('A.ZIP')).toBe(true);
      expect(ImportZipsPolicy.isTargetZipFilename('B.ZiP')).toBe(true);
    });

    test('.zipx は拒否する', () => {
      expect(ImportZipsPolicy.isTargetZipFilename('book.zipx')).toBe(false);
    });
  });

  describe('isDirectZipEntry', () => {
    test('zip内直下エントリを受理する', () => {
      expect(ImportZipsPolicy.isDirectZipEntry('1.jpeg')).toBe(true);
    });

    test('zip内ディレクトリ配下を拒否する', () => {
      expect(ImportZipsPolicy.isDirectZipEntry('pages/1.jpeg')).toBe(false);
    });
  });

  describe('sortEntryNamesByNaturalBasename', () => {
    test('basename自然順で 1,2,10 に並び替える', () => {
      expect(
        ImportZipsPolicy.sortEntryNamesByNaturalBasename(['10.jpeg', '2.jpeg', '1.jpeg']),
      ).toEqual(['1.jpeg', '2.jpeg', '10.jpeg']);
    });
  });

  describe('decideExitCode', () => {
    test('success=0, failure=0 は 0 を返す', () => {
      expect(ImportZipsPolicy.decideExitCode({ successCount: 0, failureCount: 0 })).toBe(0);
    });

    test('success>0, failure=0 は 0 を返す', () => {
      expect(ImportZipsPolicy.decideExitCode({ successCount: 1, failureCount: 0 })).toBe(0);
    });

    test('success>0, failure>0 は 1 を返す', () => {
      expect(ImportZipsPolicy.decideExitCode({ successCount: 1, failureCount: 1 })).toBe(1);
    });

    test('success=0, failure>0 は 2 を返す', () => {
      expect(ImportZipsPolicy.decideExitCode({ successCount: 0, failureCount: 1 })).toBe(2);
    });
  });

  describe('validateImportTarget', () => {
    test('引数なしは exitCode 3 / missing-arg', () => {
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: false,
        exists: false,
        readable: false,
        isDirectory: false,
      })).toEqual({ ok: false, exitCode: 3, reason: 'missing-arg' });
    });

    test('不存在/読取不可は exitCode 3 / unreadable-target', () => {
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: true,
        exists: false,
        readable: false,
        isDirectory: false,
      })).toEqual({ ok: false, exitCode: 3, reason: 'unreadable-target' });
    });

    test('ファイル指定は exitCode 4 / not-directory', () => {
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: true,
        exists: true,
        readable: true,
        isDirectory: false,
      })).toEqual({ ok: false, exitCode: 4, reason: 'not-directory' });
    });

    test('正常ディレクトリは ok=true', () => {
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: true,
        exists: true,
        readable: true,
        isDirectory: true,
      })).toEqual({ ok: true });
    });
  });
});
