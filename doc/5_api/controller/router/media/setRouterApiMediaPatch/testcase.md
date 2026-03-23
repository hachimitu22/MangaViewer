# router (PATCH /api/media/:mediaId) テストケース

## テストケース一覧
- [PATCH /api/media/:mediaId に3ハンドラーを順序どおり登録する](#patch-apimediamediaid-に3ハンドラーを順序どおり登録する)
- [登録済みハンドラーを順に実行すると認証・保存・更新が連携する](#登録済みハンドラーを順に実行すると認証保存更新が連携する)
- [authResolver が不正な場合は初期化時に例外となる](#authresolver-が不正な場合は初期化時に例外となる)
- [saveAdapter が不正な場合は初期化時に例外となる](#saveadapter-が不正な場合は初期化時に例外となる)

---

### PATCH /api/media/:mediaId に3ハンドラーを順序どおり登録する
- **前提**
  - `router.patch` をモック化する。
  - `authResolver` / `saveAdapter` / `updateMediaService` は有効な依存を注入する。
- **操作**
  - `setRouterApiMediaPatch` を実行する。
- **結果**
  - `router.patch` が1回呼ばれる。
  - 第1引数が `/api/media/:mediaId` である。
  - 第2引数以降に3つのハンドラーが設定される。

---

### 登録済みハンドラーを順に実行すると認証・保存・更新が連携する
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `saveAdapter.execute` は `req.context.contentIds` を設定して成功する。
  - `updateMediaService.execute` は成功する。
- **操作**
  - ルーターに登録された3ハンドラーを `next` で順に実行する。
- **結果**
  - 認証処理が `session_token` で呼ばれる。
  - 保存処理が `req, res, cb` 形式で呼ばれる。
  - 更新処理が実行され、成功レスポンスを返す。

---

### authResolver が不正な場合は初期化時に例外となる
- **前提**
  - `authResolver.execute` が存在しない。
- **操作**
  - `setRouterApiMediaPatch` を実行する。
- **結果**
  - `SessionAuthMiddleware` 初期化時に例外が発生する。

---

### saveAdapter が不正な場合は初期化時に例外となる
- **前提**
  - `saveAdapter.execute` が存在しない。
- **操作**
  - `setRouterApiMediaPatch` を実行する。
- **結果**
  - `ContentSaveMiddleware` 初期化時に例外が発生する。
