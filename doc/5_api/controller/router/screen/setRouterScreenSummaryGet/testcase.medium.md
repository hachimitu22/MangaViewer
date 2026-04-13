# router (GET /screen/summary) テストケース

## テストケース一覧
- [GET /screen/summary に認証・描画の2ハンドラーを登録する](#get-screensummary-に認証描画の2ハンドラーを登録する)
- [登録済みハンドラーを順に実行すると検索条件を正規化して一覧画面を描画する](#登録済みハンドラーを順に実行すると検索条件を正規化して一覧画面を描画する)
- [start と size を優先して検索条件を生成する](#start-と-size-を優先して検索条件を生成する)
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

### start と size を優先して検索条件を生成する
- **前提**
  - `searchMediaService.execute` は検索結果を返す。
- **操作**
  - `start` と `size` を含むクエリで描画ハンドラーを実行する。
- **結果**
  - `summaryPage` が指定されていても `start` と `size` を優先して検索処理へ渡す。
  - 描画データにも `start` / `size` が保持される。

---

### 検索処理で例外が発生した場合は next に委譲する
- **前提**
  - `searchMediaService.execute` が例外を送出する。
- **操作**
  - 描画ハンドラーを実行する。
- **結果**
  - `next(error)` が呼ばれる。

## medium テストで担保する観点
- `SearchMediaService` と `SequelizeMediaQueryRepository` を接続し、検索条件正規化・検索・ページネーション用描画データ生成を medium で確認する。
- `start` / `size` を画面描画条件へ反映し、後続の画面操作でも維持できることを確認する。
