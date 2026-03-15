# IContentUploadAdapter

## 概要
`ContentSaveMiddleware` が依存するアップロードアダプタのインターフェース。

multer のような `req, res, cb` 形式のミドルウェアを、Controller層へ安全に接続する責務を持つ。

---

## 機能
### コンテンツアップロード実行
- `save(req, res, cb)`

#### 入力
- `req`: Express Request
- `res`: Express Response
- `cb(error?)`: 完了通知コールバック

#### 出力/副作用
- 成功時は `cb()` を呼び出す。
- 失敗時は `cb(error)` を呼び出す。
- 成功時点で `req.context.contentIds: string[]` が利用可能であること。

#### 例外
- 非同期失敗は `cb(error)` で伝達する。

---
