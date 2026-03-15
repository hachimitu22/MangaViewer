# router (POST /api/media) テストケース

## テストケース一覧
- [POST /api/media に3ハンドラーを順序どおり登録する](#post-apimedia-に3ハンドラーを順序どおり登録する)
- [登録済みハンドラーを順に実行すると認証・保存・登録が連携する](#登録済みハンドラーを順に実行すると認証保存登録が連携する)
- [authResolver が不正な場合は初期化時に例外となる](#authresolver-が不正な場合は初期化時に例外となる)
- [saveAdapter が不正な場合は初期化時に例外となる](#saveadapter-が不正な場合は初期化時に例外となる)

---

### POST /api/media に3ハンドラーを順序どおり登録する
- **前提**
  - `router.post` をモック化する。
  - `authResolver` / `saveAdapter` / `mediaIdValueGenerator` / `mediaRepository` は有効な依存を注入する。
- **操作**
  - `setRouterApiMediaPost` を実行する。
- **結果**
  - `router.post` が1回呼ばれる。
  - 第1引数が `/api/media` である。
  - 第2引数以降に3つのハンドラーが設定される。

---

### 登録済みハンドラーを順に実行すると認証・保存・登録が連携する
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `saveAdapter.execute` は `req.context.contentIds` を設定して成功する。
  - `mediaIdValueGenerator.generate` は `mediaId` を返す。
  - `mediaRepository.save` は保存成功とする。
- **操作**
  - ルーターに登録された3ハンドラーを `next` で順に実行する。
- **結果**
  - 認証処理が `session_token` で呼ばれる。
  - 保存処理が `req, res, cb` 形式で呼ばれる。
  - 登録処理が実行され、`200` + `code: 0` + `mediaId` が返る。

---

### authResolver が不正な場合は初期化時に例外となる
- **前提**
  - `authResolver.execute` が存在しない。
- **操作**
  - `setRouterApiMediaPost` を実行する。
- **結果**
  - `SessionAuthMiddleware` 初期化時に例外が発生する。

---

### saveAdapter が不正な場合は初期化時に例外となる
- **前提**
  - `saveAdapter.execute` が存在しない。
- **操作**
  - `setRouterApiMediaPost` を実行する。
- **結果**
  - `ContentSaveMiddleware` 初期化時に例外が発生する。
