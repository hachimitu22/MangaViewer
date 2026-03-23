# MulterDiskStorageContentUploadAdapter 設計書

## 概要
`MulterDiskStorageContentUploadAdapter` は、multipart/form-data で送信されたメディアコンテンツをディスクへ保存し、アプリケーションで扱う `contentId` 配列へ変換するアダプターです。  
既存コンテンツ参照と新規アップロードを同一リクエストで扱い、`position` 順に並べ替えた `contentIds` を `req.context` へ格納します。

## クラス
- 配置: `src/infrastructure/MulterDiskStorageContentUploadAdapter.js`
- クラス名: `MulterDiskStorageContentUploadAdapter`
- 継承: `IContentUploadAdapter`

## 公開メソッド
- `constructor({ rootDirectory })`
  - 保存先ルートディレクトリを受け取る
  - 内部で `multer.diskStorage(...).any()` を構成する
- `execute(req, res, cb)`
  - Multer で受信したファイルを保存する
  - `req.body.contents` と `req.files` を突き合わせて `req.context.contentIds` を構築する
  - 成功時は `cb()`、失敗時は `cb(error)` を呼ぶ

## 保存方針
- 新規ファイルの `contentId` は UUID 由来 32 文字小文字16進数で生成する
- 保存パスは `rootDirectory/aa/bb/cc/dd/<contentId>` 形式で分散配置する
- 既存パスと衝突した場合は `contentId` を再生成する
- リクエスト上は `contents[n][position]` と `contents[n][file]` / `contents[n][url]` を組み合わせる
- 返却する `contentIds` は `position` 昇順に並び替える

## バリデーション方針
- `rootDirectory` は空文字でない文字列を必須とする
- `contents` は 1 件以上を必須とする
- 各 content は `position >= 1` の整数を持つ
- 1 件の content では「新規ファイル」または「既存 `contentId`」のどちらか一方のみ指定可能とする
- 既存 `contentId` と生成済み `contentId` は 32 文字小文字16進数でなければならない
- `position` 重複、`contents[n][file]` 以外の fieldname、同一 index への複数ファイルはエラーとする

## エラー方針
- Multer 保存中の例外は `cb(error)` へ伝える
- リクエスト整形エラーは `execute` 内で補足し `cb(processingError)` へ渡す
