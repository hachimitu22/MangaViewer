# ImportZipsPolicy 設計書

## 概要
- `ImportZips` CLI の判定・計算ロジックを、`scripts/ImportZips.js` から分離して公開APIとして提供する。
- 目的は、smallテストの対象を private 実装ではなく public API にすること。
- `ImportZipsPolicy` は I/O（ファイルアクセス、解凍、保存、ログ出力）を持たない純粋ロジック層とする。

## 責務
- 画像拡張子判定
- zipファイル名判定
- zip内エントリの直下判定
- basename自然順の並び替え
- 集計結果から終了コード決定
- CLI事前チェック結果の判定

## 対象実装
- `src/application/app/importZips/ImportZipsPolicy.js`

## 非責務
- ファイルシステム操作
- zip解凍処理
- DB保存・コンテンツ保存
- ログ出力
- `RegisterMediaService` 呼び出し

## 公開API

### `isSupportedImageExtension(filename)`
- 入力: ファイル名文字列
- 仕様:
  - 拡張子で判定する（大文字小文字は区別しない）。
  - 許可拡張子: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- 出力: `boolean`

### `isTargetZipFilename(filename)`
- 入力: ファイル名文字列
- 仕様:
  - `.zip` を大文字小文字非区別で判定する。
- 出力: `boolean`

### `isDirectZipEntry(entryName)`
- 入力: zipエントリ名
- 仕様:
  - zip直下エントリのみ `true`。
  - ディレクトリ区切り（`/`）を含む場合は `false`。
- 出力: `boolean`

### `sortEntryNamesByNaturalBasename(entryNames)`
- 入力: 文字列配列
- 仕様:
  - basename 自然順で並び替える。
  - 大文字小文字は区別する（ImportZips仕様に準拠）。
- 出力: 並び替え後の新しい配列

### `decideExitCode({ successCount, failureCount })`
- 入力: `successCount` / `failureCount`
- 仕様:
  - `success=0, failure=0` => `0`（zip 0件を全件成功扱い）
  - `success>0, failure=0` => `0`
  - `success>0, failure>0` => `1`
  - `success=0, failure>0` => `2`
- 出力: `0 | 1 | 2`

### `validateImportTarget({ hasArg, exists, readable, isDirectory })`
- 入力: 事前チェックに必要な状態
- 仕様:
  - 引数なし => `{ ok: false, exitCode: 3, reason: 'missing-arg' }`
  - 不存在/読取不可 => `{ ok: false, exitCode: 3, reason: 'unreadable-target' }`
  - ファイル指定（ディレクトリでない） => `{ ok: false, exitCode: 4, reason: 'not-directory' }`
  - それ以外 => `{ ok: true }`
- 出力: 判定結果オブジェクト

## ImportZips からの移譲方針
- `scripts/ImportZips.js` は次のみを担当する。
  - 実環境の状態収集（`fs` で exists/readable/isDirectory を取得）
  - `ImportZipsPolicy.validateImportTarget(...)` 呼び出し
  - 走査・解凍・保存・ログ出力・`RegisterMediaService` 呼び出し
- 判定/計算は `ImportZipsPolicy` 呼び出しに統一する。

## 関連ドキュメント
- [ImportZips 設計書](/doc/4_application/app/ImportZips/readme.md)
- [ImportZips テストケース（small）](/doc/4_application/app/ImportZips/testcase.small.md)
- [ImportZips テストケース（medium）](/doc/4_application/app/ImportZips/testcase.medium.md)
- [ImportZips テストケース（large）](/doc/4_application/app/ImportZips/testcase.large.md)
- [ImportZipsPolicy テストケース（small）](/doc/4_application/app/ImportZipsPolicy/testcase.small.md)
- [ImportZipsPolicy テストケース（medium）](/doc/4_application/app/ImportZipsPolicy/testcase.medium.md)
- [ImportZipsPolicy テストケース（large）](/doc/4_application/app/ImportZipsPolicy/testcase.large.md)
