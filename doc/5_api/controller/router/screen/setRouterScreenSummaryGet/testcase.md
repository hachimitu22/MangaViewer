# router (GET /screen/summary) テストケース

## テストケース一覧
- [GET /screen/summary に認証・描画の2ハンドラーを登録する](#get-screensummary-に認証描画の2ハンドラーを登録する)
- [登録済みハンドラーを順に実行すると検索条件を正規化して一覧画面を描画する](#登録済みハンドラーを順に実行すると検索条件を正規化して一覧画面を描画する)
- [検索処理で例外が発生した場合は next に委譲する](#検索処理で例外が発生した場合は-next-に委譲する)

---

### GET /screen/summary に認証・描画の2ハンドラーを登録する
- **前提**
  - `router.get` をモック化する。
  - `authResolver` / `searchMediaService` は有効な依存を注入する。
- **操作**
  - `setRouterScreenSummaryGet` を実行する。
- **結果**
  - `router.get` が1回呼ばれる。
  - 第1引数が `/screen/summary` である。
  - 第2引数以降に2つのハンドラーが設定される。

---

### 登録済みハンドラーを順に実行すると検索条件を正規化して一覧画面を描画する
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `searchMediaService.execute` は検索結果を返す。
- **操作**
  - 登録済みの2ハンドラーを順に実行する。
- **結果**
  - `summaryPage` / `title` / `tags` / `sort` が正規化されて検索処理に渡される。
  - `screen/summary` がページネーション情報付きで描画される。

---

### 検索処理で例外が発生した場合は next に委譲する
- **前提**
  - `searchMediaService.execute` が例外を送出する。
- **操作**
  - 描画ハンドラーを実行する。
- **結果**
  - `next(error)` が呼ばれる。
