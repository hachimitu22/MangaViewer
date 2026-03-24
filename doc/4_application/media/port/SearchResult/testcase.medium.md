# SearchResult テストケース

## テストケース一覧
- [small: 妥当な検索結果を生成できる](#small-妥当な検索結果を生成できる)
- [small: 不正な mediaOverviews や totalCount は例外を送出する](#small-不正な-mediaoverviews-や-totalcount-は例外を送出する)
- [medium: SequelizeMediaQueryRepository の検索結果を SearchMediaService が画面用 DTO へ引き継げる](#medium-sequelizemediaqueryrepository-の検索結果を-searchmediaservice-が画面用-dto-へ引き継げる)
- [medium: /screen/summary が totalCount と mediaOverviews を使って一覧描画とページネーションを行える](#medium-screensummary-が-totalcount-と-mediaoverviews-を使って一覧描画とページネーションを行える)

---

### small: 妥当な検索結果を生成できる
- 前提
  - `mediaId`、`title`、`thumbnail`、`tags`、`priorityCategories` を持つメディア概要を用意する。
- 操作
  - `mediaOverviews` と `totalCount` を渡して `SearchResult` を生成する。
- 期待結果
  - 例外を送出せずインスタンス生成できる。
  - `mediaOverviews` 内の要素が `MediaOverview` / `MediaOverviewTag` として保持される。
  - `totalCount` が保持される。

### small: 不正な mediaOverviews や totalCount は例外を送出する
- 前提
  - 生成対象クラスが読み込まれている。
- 操作
  - `mediaOverviews` に配列以外や必須項目欠落データ、`tags` の型違反、`priorityCategories` の型違反を渡す。
  - `totalCount` に負数・小数・非数を渡す。
- 期待結果
  - いずれも `Error` を送出する。

### medium: SequelizeMediaQueryRepository の検索結果を SearchMediaService が画面用 DTO へ引き継げる
- 前提
  - `SequelizeMediaQueryRepository` と `SearchMediaService` を接続した環境がある。
  - 対象メディアにコンテンツ、タグ、カテゴリー優先度が設定されている。
- 操作
  - 検索を実行し、`SearchResult` を経由した `SearchMediaService.Output` を取得する。
- 期待結果
  - `mediaOverviews` の各項目が欠落せず `Output` へ引き継がれる。
  - `thumbnail`、`tags` の並び、`priorityCategories`、`totalCount` が維持される。

### medium: /screen/summary が totalCount と mediaOverviews を使って一覧描画とページネーションを行える
- 前提
  - `/screen/summary` の描画処理を実行できる。
- 操作
  - 複数件検索結果と0件検索結果の両方を返すようにして画面を描画する。
- 期待結果
  - 複数件時はメディアカード描画とページネーション計算が行われる。
  - 0件時は空一覧でもエラーとならず、`totalCount = 0` 前提の表示が成立する。
