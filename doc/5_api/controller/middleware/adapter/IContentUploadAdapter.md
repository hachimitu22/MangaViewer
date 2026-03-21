# IContentUploadAdapter

## 概要
`ContentSaveMiddleware` が依存するアップロードアダプタのインターフェース。

multer のような `req, res, cb` 形式のミドルウェアを、Controller層へ安全に接続する責務を持つ。

---

## 機能
### コンテンツアップロード実行
- `execute(req, res, cb)`

#### 入力
- `req`: Express Request
- `res`: Express Response
- `cb(error?)`: 完了通知コールバック

#### 出力/副作用
- 成功時は `cb()` を呼び出す。
- 失敗時は `cb(error)` を呼び出す。
- 成功時点で `req.context.contentIds: string[]` が利用可能であること。
- `req.context.contentIds` は `contents[n].position` 昇順であること。

#### 具象クラス実装ルール
- multer の `DiskStorage` を使う具象クラスを想定する。
- コンストラクタで保存先ルートディレクトリを受け取る。
- 新規保存時の `contentId` と保存ファイル名は、UUID 由来のハイフンなし32文字・小文字16進数とする。
- 保存先パスは `rootDirectory/aa/bb/cc/dd/aabbccddeeff...` の形式とする。
- 生成した保存先パスが既存ファイルと衝突した場合は、衝突しなくなるまで `contentId` を再生成する。
- `contents[n]` は `file` または `url` のどちらか一方が必須であり、両方指定・両方未指定は不正とする。
- `contents[n].url` には既存 `contentId` のみを入れ、`^[0-9a-f]{32}$` に一致しなければならない。
- `contents[n][file]` 形式以外の file field は不正とする。
- `contents[n].position` は必須であり、1以上の整数とする。
- `position` 重複を不正とし、入力構造や値の不正はすべて `cb(error)` で返す。

#### 例外
- 非同期失敗は `cb(error)` で伝達する。

---
