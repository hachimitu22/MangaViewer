# router (POST /api/login) テストケース

## テストケース一覧
- [POST /api/login にログインコントローラーを登録する](#post-apilogin-にログインコントローラーを登録する)
- [登録済みハンドラーを実行すると loginService が呼ばれる](#登録済みハンドラーを実行すると-loginservice-が呼ばれる)
- [loginService が不正な場合は初期化時に例外となる](#loginservice-が不正な場合は初期化時に例外となる)

---

### POST /api/login にログインコントローラーを登録する
- **前提**
  - `router.post` をモック化する。
  - `loginService` は有効な依存を注入する。
- **操作**
  - `setRouterApiLogin` を実行する。
- **結果**
  - `router.post` が1回呼ばれる。
  - 第1引数が `/api/login` である。
  - 第2引数に1つのハンドラーが設定される。

---

### 登録済みハンドラーを実行すると loginService が呼ばれる
- **前提**
  - `loginService.execute` はログイン成功結果を返す。
- **操作**
  - ルーターに登録されたハンドラーを実行する。
- **結果**
  - `loginService.execute` が1回呼ばれる。
  - `200` が返る。

---

### loginService が不正な場合は初期化時に例外となる
- **前提**
  - `loginService.execute` が存在しない。
- **操作**
  - `setRouterApiLogin` を実行する。
- **結果**
  - `LoginPostController` 初期化時に例外が発生する。
