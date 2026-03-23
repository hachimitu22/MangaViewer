# router (POST /api/logout) テストケース

## テストケース一覧
- [POST /api/logout に認証・ログアウトの2ハンドラーを登録する](#post-apilogout-に認証ログアウトの2ハンドラーを登録する)
- [登録済みハンドラーを順に実行すると logoutService が呼ばれる](#登録済みハンドラーを順に実行すると-logoutservice-が呼ばれる)
- [logoutService が不正な場合は初期化時に例外となる](#logoutservice-が不正な場合は初期化時に例外となる)

---

### POST /api/logout に認証・ログアウトの2ハンドラーを登録する
- **前提**
  - `router.post` をモック化する。
  - `authResolver` / `logoutService` は有効な依存を注入する。
- **操作**
  - `setRouterApiLogout` を実行する。
- **結果**
  - `router.post` が1回呼ばれる。
  - 第1引数が `/api/logout` である。
  - 第2引数以降に2つのハンドラーが設定される。

---

### 登録済みハンドラーを順に実行すると logoutService が呼ばれる
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `logoutService.execute` は成功結果を返す。
- **操作**
  - ルーターに登録された2ハンドラーを `next` で順に実行する。
- **結果**
  - 認証処理が `session_token` で呼ばれる。
  - `logoutService.execute` が1回呼ばれる。
  - `200` が返る。

---

### logoutService が不正な場合は初期化時に例外となる
- **前提**
  - `logoutService.execute` が存在しない。
- **操作**
  - `setRouterApiLogout` を実行する。
- **結果**
  - `LogoutPostController` 初期化時に例外が発生する。
