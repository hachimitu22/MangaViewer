# SequelizeMediaQueryRepository テストケース

## テストケース一覧
- [search は未指定 models でも空データから SearchResult を返す](#search-は未指定-models-でも空データから-searchresult-を返す)
- [存在しないタグ条件の search は空配列と totalCount 0 を返す](#存在しないタグ条件の-search-は空配列と-totalcount-0-を返す)
- [findOverviewsByMediaIds は存在しない ID を無視しサムネイルとタグ順を整える](#findoverviewsbymediaids-は存在しない-id-を無視しサムネイルとタグ順を整える)
- [search / findOverviewsByMediaIds は不正入力で例外を送出する](#search--findoverviewsbymediaids-は不正入力で例外を送出する)

---

### search は未指定 models でも空データから SearchResult を返す
- 前提
  - `SequelizeMediaRepository.sync()` でテーブルが作成済みである
  - メディアは1件も保存されていない
- 操作
  - 空条件に近い `SearchCondition` で `search` を実行する
- 期待結果
  - `totalCount` は `0` である
  - `mediaOverviews` は空配列である

### 存在しないタグ条件の search は空配列と totalCount 0 を返す
- 前提
  - 1件以上のメディアが保存済みである
  - 検索対象タグは存在しない
- 操作
  - 未登録タグを含む `SearchCondition` で `search` を実行する
- 期待結果
  - 条件不一致として `totalCount` は `0` になる
  - `mediaOverviews` は空配列になる

### findOverviewsByMediaIds は存在しない ID を無視しサムネイルとタグ順を整える
- 前提
  - タグと優先カテゴリーを持つメディアが保存済みである
  - 対象メディアは少なくとも1件のコンテンツを持つ
- 操作
  - 存在する ID と存在しない ID を混ぜて `findOverviewsByMediaIds` を実行する
- 期待結果
  - 存在しない ID は結果から除外される
  - `thumbnail` には先頭コンテンツIDが設定される
  - タグは優先カテゴリー順に整列される

### search / findOverviewsByMediaIds は不正入力で例外を送出する
- 前提
  - リポジトリが生成済みである
- 操作
  - `SearchCondition` 以外、配列以外、不正な ID 要素を渡して各メソッドを実行する
- 期待結果
  - `Error` が送出される
