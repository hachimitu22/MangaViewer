# SequelizeMediaQueryRepository テストケース

## テストケース一覧
- [search は一覧表示に必要な概要情報と totalCount を返す](#search-は一覧表示に必要な概要情報と-totalcount-を返す)

---

### search は一覧表示に必要な概要情報と totalCount を返す
- 前提
  - `SequelizeMediaRepository` 経由で複数メディアが保存済みである
  - タイトル・タグ・優先カテゴリー・コンテンツ順が検索に使える状態である
- 操作
  - タイトル条件、タグ条件、ソート条件、ページング条件を含む `SearchCondition` で `search` を実行する
- 期待結果
  - 条件一致件数が `totalCount` に反映される
  - 返却される `mediaOverviews` に `mediaId` / `title` / `thumbnail` / `priorityCategories` / `tags` が含まれる
  - サムネイルは先頭コンテンツ、タグ順は優先カテゴリー順に整列される
