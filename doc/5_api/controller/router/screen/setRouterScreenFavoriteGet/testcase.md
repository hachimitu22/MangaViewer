# router (GET /screen/favorite) テストケース

## テストケース一覧
- [GET /screen/favorite に認証・描画の2ハンドラーを登録する](#get-screenfavorite-に認証描画の2ハンドラーを登録する)
- [登録済みハンドラーを順に実行するとお気に入り一覧画面を描画する](#登録済みハンドラーを順に実行するとお気に入り一覧画面を描画する)
- [一覧取得で例外が発生した場合は next に委譲する](#一覧取得で例外が発生した場合は-next-に委譲する)

---

### GET /screen/favorite に認証・描画の2ハンドラーを登録する
- **前提**
  - `router.get` をモック化する。
  - `authResolver` / `getFavoriteSummariesService` は有効な依存を注入する。
- **操作**
  - `setRouterScreenFavoriteGet` を実行する。
- **結果**
  - `router.get` が1回呼ばれる。
  - 第1引数が `/screen/favorite` である。
  - 第2引数以降に2つのハンドラーが設定される。

---

### 登録済みハンドラーを順に実行するとお気に入り一覧画面を描画する
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `getFavoriteSummariesService.execute` は一覧結果を返す。
- **操作**
  - 登録済みの2ハンドラーを順に実行する。
- **結果**
  - `screen/favorite` が `mediaOverviews` を含む表示データで描画される。

---

### 一覧取得で例外が発生した場合は next に委譲する
- **前提**
  - `getFavoriteSummariesService.execute` が例外を送出する。
- **操作**
  - 描画ハンドラーを実行する。
- **結果**
  - `next(error)` が呼ばれる。
