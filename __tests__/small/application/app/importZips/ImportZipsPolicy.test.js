const MODULE_PATH = '../../../../../src/application/app/importZips/ImportZipsPolicy';

let ImportZipsPolicy;
let moduleLoadError;

try {
  ImportZipsPolicy = require(MODULE_PATH);
} catch (error) {
  moduleLoadError = error;
}

const runOrTodo = (title, fn) => {
  if (ImportZipsPolicy) {
    test(title, fn);
    return;
  }

  test.todo(`${title} (未実装: ${MODULE_PATH})`);
};

const assertModuleIsReady = () => {
  if (ImportZipsPolicy) {
    return;
  }

  throw new Error([
    `テスト対象モジュールが未実装です: ${MODULE_PATH}`,
    '本テストは product code 実装前の先行テストとして追加されています。',
    '実装着手後は src/application/app/importZips/ImportZipsPolicy.js を追加し、',
    '本テストの todo が自動的に実行へ切り替わることを確認してください。',
    `load error: ${moduleLoadError && moduleLoadError.message}`,
  ].join('\n'));
};

describe('ImportZipsPolicy (small)', () => {
  runOrTodo('公開API: 必要な関数を公開する', () => {
    assertModuleIsReady();

    expect(typeof ImportZipsPolicy.isSupportedImageExtension).toBe('function');
    expect(typeof ImportZipsPolicy.isTargetZipFilename).toBe('function');
    expect(typeof ImportZipsPolicy.isDirectZipEntry).toBe('function');
    expect(typeof ImportZipsPolicy.sortEntryNamesByNaturalBasename).toBe('function');
    expect(typeof ImportZipsPolicy.decideExitCode).toBe('function');
    expect(typeof ImportZipsPolicy.validateImportTarget).toBe('function');
  });

  describe('isSupportedImageExtension', () => {
    runOrTodo('.jpg を受理する', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.jpg')).toBe(true);
    });

    runOrTodo('.jpeg を受理する', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.jpeg')).toBe(true);
    });

    runOrTodo('.png/.gif/.webp を受理する', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.png')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.gif')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.webp')).toBe(true);
    });

    runOrTodo('許可拡張子は大文字小文字を区別しない', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.isSupportedImageExtension('A.JPG')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('B.JPEG')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('C.PnG')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('D.GIF')).toBe(true);
      expect(ImportZipsPolicy.isSupportedImageExtension('E.WeBp')).toBe(true);
    });

    runOrTodo('非許可拡張子（.bmp/.avif/.txt）と拡張子なしを拒否する', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.bmp')).toBe(false);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.avif')).toBe(false);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample.txt')).toBe(false);
      expect(ImportZipsPolicy.isSupportedImageExtension('sample')).toBe(false);
    });
  });

  describe('isTargetZipFilename', () => {
    runOrTodo('.zip を受理する', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.isTargetZipFilename('book.zip')).toBe(true);
    });

    runOrTodo('.ZIP など大文字混在も受理する', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.isTargetZipFilename('A.ZIP')).toBe(true);
      expect(ImportZipsPolicy.isTargetZipFilename('B.ZiP')).toBe(true);
    });

    runOrTodo('.zipx は拒否する', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.isTargetZipFilename('book.zipx')).toBe(false);
    });
  });

  describe('isDirectZipEntry', () => {
    runOrTodo('zip内直下エントリを受理する', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.isDirectZipEntry('1.jpeg')).toBe(true);
    });

    runOrTodo('zip内ディレクトリ配下を拒否する', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.isDirectZipEntry('pages/1.jpeg')).toBe(false);
    });
  });

  describe('sortEntryNamesByNaturalBasename', () => {
    runOrTodo('basename自然順で 1,2,10 に並び替える', () => {
      assertModuleIsReady();
      expect(
        ImportZipsPolicy.sortEntryNamesByNaturalBasename(['10.jpeg', '2.jpeg', '1.jpeg']),
      ).toEqual(['1.jpeg', '2.jpeg', '10.jpeg']);
    });
  });

  describe('decideExitCode', () => {
    runOrTodo('success=0, failure=0 は 0 を返す', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.decideExitCode({ successCount: 0, failureCount: 0 })).toBe(0);
    });

    runOrTodo('success>0, failure=0 は 0 を返す', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.decideExitCode({ successCount: 1, failureCount: 0 })).toBe(0);
    });

    runOrTodo('success>0, failure>0 は 1 を返す', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.decideExitCode({ successCount: 1, failureCount: 1 })).toBe(1);
    });

    runOrTodo('success=0, failure>0 は 2 を返す', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.decideExitCode({ successCount: 0, failureCount: 1 })).toBe(2);
    });
  });

  describe('validateImportTarget', () => {
    runOrTodo('引数なしは exitCode 3 / missing-arg', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: false,
        exists: false,
        readable: false,
        isDirectory: false,
      })).toEqual({ ok: false, exitCode: 3, reason: 'missing-arg' });
    });

    runOrTodo('不存在/読取不可は exitCode 3 / unreadable-target', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: true,
        exists: false,
        readable: false,
        isDirectory: false,
      })).toEqual({ ok: false, exitCode: 3, reason: 'unreadable-target' });
    });

    runOrTodo('ファイル指定は exitCode 4 / not-directory', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: true,
        exists: true,
        readable: true,
        isDirectory: false,
      })).toEqual({ ok: false, exitCode: 4, reason: 'not-directory' });
    });

    runOrTodo('正常ディレクトリは ok=true', () => {
      assertModuleIsReady();
      expect(ImportZipsPolicy.validateImportTarget({
        hasArg: true,
        exists: true,
        readable: true,
        isDirectory: true,
      })).toEqual({ ok: true });
    });
  });
});
