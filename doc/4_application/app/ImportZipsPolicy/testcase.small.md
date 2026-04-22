# ImportZipsPolicy テストケース（small）

## 方針
- すべて `ImportZipsPolicy` の公開APIを対象にする。
- 1ケース1振る舞いで、期待値は観測可能な戻り値として固定する。

## isSupportedImageExtension
### P-EXT-01: `.jpe` を受理する
- 前提: `sample.jpe`
- 操作: `isSupportedImageExtension(filename)`
- 期待結果: `true`

### P-EXT-02: `.jpeg` を受理する
- 前提: `sample.jpeg`
- 操作: `isSupportedImageExtension(filename)`
- 期待結果: `true`

### P-EXT-03: `.png` を受理する
- 前提: `sample.png`
- 操作: `isSupportedImageExtension(filename)`
- 期待結果: `true`

### P-EXT-04: `.gif` を受理する
- 前提: `sample.gif`
- 操作: `isSupportedImageExtension(filename)`
- 期待結果: `true`

### P-EXT-05: `.webp` を受理する
- 前提: `sample.webp`
- 操作: `isSupportedImageExtension(filename)`
- 期待結果: `true`

### P-EXT-06: `.bmp` を受理する
- 前提: `sample.bmp`
- 操作: `isSupportedImageExtension(filename)`
- 期待結果: `true`

### P-EXT-07: 大文字小文字混在を受理する
- 前提: `A.JPE`, `B.JPEG`, `C.PnG`, `D.GIF`, `E.WeBp`, `F.BMP`
- 操作: 各入力で `isSupportedImageExtension(filename)`
- 期待結果: すべて `true`

### P-EXT-08: 非許可拡張子を拒否する
- 前提: `sample.jpg`, `sample.avif`, `sample.txt`, `sample`
- 操作: 各入力で `isSupportedImageExtension(filename)`
- 期待結果: すべて `false`

## isTargetZipFilename
### P-ZIP-01: `.zip` を受理する
- 前提: `book.zip`
- 操作: `isTargetZipFilename(filename)`
- 期待結果: `true`

### P-ZIP-02: 大文字小文字混在 `.ZIP` を受理する
- 前提: `A.ZIP`, `B.ZiP`
- 操作: `isTargetZipFilename(filename)`
- 期待結果: すべて `true`

### P-ZIP-03: `.zipx` を拒否する
- 前提: `book.zipx`
- 操作: `isTargetZipFilename(filename)`
- 期待結果: `false`

## isDirectZipEntry
### P-ENTRY-01: 直下ファイルを受理する
- 前提: `1.jpeg`
- 操作: `isDirectZipEntry(entryName)`
- 期待結果: `true`

### P-ENTRY-02: ディレクトリ配下ファイルを拒否する
- 前提: `pages/1.jpeg`
- 操作: `isDirectZipEntry(entryName)`
- 期待結果: `false`

## sortEntryNamesByNaturalBasename
### P-SORT-01: 自然順に並び替える
- 前提: `['10.jpeg', '2.jpeg', '1.jpeg']`
- 操作: `sortEntryNamesByNaturalBasename(entryNames)`
- 期待結果: `['1.jpeg', '2.jpeg', '10.jpeg']`

## decideExitCode
### P-EXIT-01: success=0, failure=0 は 0
- 前提: `{ successCount: 0, failureCount: 0 }`
- 操作: `decideExitCode(...)`
- 期待結果: `0`

### P-EXIT-02: success>0, failure=0 は 0
- 前提: `{ successCount: 1, failureCount: 0 }`
- 操作: `decideExitCode(...)`
- 期待結果: `0`

### P-EXIT-03: success>0, failure>0 は 1
- 前提: `{ successCount: 1, failureCount: 1 }`
- 操作: `decideExitCode(...)`
- 期待結果: `1`

### P-EXIT-04: success=0, failure>0 は 2
- 前提: `{ successCount: 0, failureCount: 1 }`
- 操作: `decideExitCode(...)`
- 期待結果: `2`

## validateImportTarget
### P-PRE-01: 引数なしは exitCode 3
- 前提: `{ hasArg: false, exists: false, readable: false, isDirectory: false }`
- 操作: `validateImportTarget(...)`
- 期待結果: `{ ok: false, exitCode: 3, reason: 'missing-arg' }`

### P-PRE-02: 不存在/読取不可は exitCode 3
- 前提: `{ hasArg: true, exists: false, readable: false, isDirectory: false }`
- 操作: `validateImportTarget(...)`
- 期待結果: `{ ok: false, exitCode: 3, reason: 'unreadable-target' }`

### P-PRE-03: ファイル指定は exitCode 4
- 前提: `{ hasArg: true, exists: true, readable: true, isDirectory: false }`
- 操作: `validateImportTarget(...)`
- 期待結果: `{ ok: false, exitCode: 4, reason: 'not-directory' }`

### P-PRE-04: 正常ディレクトリは ok=true
- 前提: `{ hasArg: true, exists: true, readable: true, isDirectory: true }`
- 操作: `validateImportTarget(...)`
- 期待結果: `{ ok: true }`
