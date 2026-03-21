# MulterDiskStorageContentUploadAdapter

## 概要
`IContentUploadAdapter` の multer `DiskStorage` 前提の具象クラス。

`POST /api/media` の multipart/form-data を受け取り、
新規ファイルをディスクへ保存しつつ、既存 `contentId` の再利用にも対応する。

## コンストラクタ
- `new MulterDiskStorageContentUploadAdapter({ rootDirectory })`

### 引数
- `rootDirectory: string`
  - コンテンツ保存先ルートディレクトリ

## 入力仕様
- file field は `contents[n][file]` 形式のみ受理する。
- 各 `contents[n]` は次を満たす。
  - `position` は必須
  - `file` または `url` のどちらか一方が必須
  - `file` と `url` の同時指定は禁止
- `url` には既存 `contentId` を指定する。
- `contentId` は `^[0-9a-f]{32}$` に一致する小文字32文字とする。

## 保存仕様
### 新規ファイル
1. UUID を生成する。
2. ハイフンを除去し、小文字化して `contentId` を得る。
3. 保存先パス `rootDirectory/aa/bb/cc/dd/contentId` を求める。
4. 保存先パスが既存ファイルと衝突した場合は再生成する。
5. `DiskStorage` によりファイル名 `contentId` で保存する。

### 既存ファイル
- `url` に指定された `contentId` をそのまま採用する。
- 実ファイルの存在確認は行わない。

## 出力仕様
- 保存完了後、`req.context.contentIds` を設定する。
- `contentIds` は `contents[n].position` 昇順とする。

## エラーハンドリング
以下はすべて `cb(error)` で返す。
- `contents` 未指定
- `position` 欠落、整数以外、1未満
- `position` 重複
- `contents[n][file]` 以外の file field
- `file` と `url` の同時指定
- `file` と `url` の両方未指定
- `url` が小文字32文字16進数でない
- 保存先ディレクトリ作成やファイル保存で発生した I/O エラー
