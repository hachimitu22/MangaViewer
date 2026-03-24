# router (GET /screen/favorite) テストケース

## テストケース一覧
- [GET /screen/favorite に認証・描画の2ハンドラーを登録する](#get-screenfavorite-に認証描画の2ハンドラーを登録する)
- [sort/page クエリを解釈してお気に入り一覧画面を描画する](#sortpage-クエリを解釈してお気に入り一覧画面を描画する)
- [sort/page の不正値をデフォルトへ丸める](#sortpage-の不正値をデフォルトへ丸める)
- [一覧取得で例外が発生した場合は next に委譲する](#一覧取得で例外が発生した場合は-next-に委譲する)
- [medium: 並び順変更で指定順に描画される](#medium-並び順変更で指定順に描画される)
- [medium: ページ移動で現在ページ情報を保持して描画される](#medium-ページ移動で現在ページ情報を保持して描画される)
- [medium: タグ導線が /screen/summary を向き並び順を保持する](#medium-タグ導線が-screensummary-を向き並び順を保持する)

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

### sort/page クエリを解釈してお気に入り一覧画面を描画する
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `getFavoriteSummariesService.execute` は一覧結果を返す。
- **操作**
  - `GET /screen/favorite?sort=title_desc&page=2` を実行する。
- **結果**
  - `screen/favorite` が `mediaOverviews` / `totalCount` / `currentConditions` / `pagination` / `sortOptions` を含む表示データで描画される。
  - `getFavoriteSummariesService.execute` が `sort=title_desc` / `page=2` を含む `Input` で呼ばれる。

---

### sort/page の不正値をデフォルトへ丸める
- **前提**
  - `getFavoriteSummariesService.execute` は有効な一覧結果を返す。
- **操作**
  - `GET /screen/favorite?sort=invalid&page=0` を実行する。
- **結果**
  - `getFavoriteSummariesService.execute` が `sort=date_asc` / `page=1` を含む `Input` で呼ばれる。

---

### 一覧取得で例外が発生した場合は next に委譲する
- **前提**
  - `getFavoriteSummariesService.execute` が例外を送出する。
- **操作**
  - 描画ハンドラーを実行する。
- **結果**
  - `next(error)` が呼ばれる。

---

### medium: 並び順変更で指定順に描画される
- **前提**
  - 永続化済み favorite が複数存在する。
- **操作**
  - `GET /screen/favorite?sort=title_asc&page=1` を実行する。
- **結果**
  - タイトル昇順で描画される。

---

### medium: ページ移動で現在ページ情報を保持して描画される
- **前提**
  - 永続化済み favorite が 21 件以上存在する。
- **操作**
  - `GET /screen/favorite?sort=date_desc&page=2` を実行する。
- **結果**
  - 2 ページ目として描画される。
  - ページネーション情報に 1, 2 ページが含まれる。

---

### medium: タグ導線が /screen/summary を向き並び順を保持する
- **前提**
  - タグ付き favorite が存在する。
- **操作**
  - `GET /screen/favorite?sort=title_desc&page=1` を実行する。
- **結果**
  - タグリンクが `/screen/summary?summaryPage=1&sort=title_desc&tags=...` を向く。

## medium テストで担保する観点
- `GetFavoriteSummariesService` と永続化済み favorite データを接続し、並び順変更・ページ移動・タグ導線を含む画面描画を確認する。
