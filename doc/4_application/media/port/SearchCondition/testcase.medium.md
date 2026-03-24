# SearchCondition テストケース

## テストケース一覧
- [small: 妥当な検索条件を生成できる](#small-妥当な検索条件を生成できる)
- [small: 不正な型や範囲の検索条件は例外を送出する](#small-不正な型や範囲の検索条件は例外を送出する)
- [medium: SearchMediaService から渡した検索条件が SequelizeMediaQueryRepository の検索結果へ反映される](#medium-searchmediaservice-から渡した検索条件が-sequelizemediaqueryrepository-の検索結果へ反映される)
- [medium: /screen/summary の正規化結果が SearchCondition の制約を満たす](#medium-screensummary-の正規化結果が-searchcondition-の制約を満たす)

---

### small: 妥当な検索条件を生成できる
- 前提
  - `SearchConditionTag` を使ってカテゴリー・ラベルを持つタグを用意する。
- 操作
  - `title`、`tags`、`sortType`、`start`、`size` に妥当な値を渡して `SearchCondition` を生成する。
- 期待結果
  - 例外を送出せずインスタンス生成できる。
  - 各プロパティに指定した値が保持される。

### small: 不正な型や範囲の検索条件は例外を送出する
- 前提
  - 生成対象クラスが読み込まれている。
- 操作
  - `title` に非文字列、`tags` に非配列や `SearchConditionTag` 以外、`sortType` に未知値、`start` / `size` に 0・負数・小数を渡して生成する。
- 期待結果
  - いずれも `Error` を送出する。

### medium: SearchMediaService から渡した検索条件が SequelizeMediaQueryRepository の検索結果へ反映される
- 前提
  - `SearchMediaService` と `SequelizeMediaQueryRepository` を接続したテスト環境がある。
  - タイトル・タグ・登録順が異なるメディアが複数登録済みである。
- 操作
  - タイトル、タグ、`sortType`、`start`、`size` を変えながら検索を実行する。
- 期待結果
  - タイトル部分一致が反映される。
  - タグは全件一致で絞り込まれる。
  - `sortType` ごとの並び順と `start` / `size` によるページングが反映される。

### medium: /screen/summary の正規化結果が SearchCondition の制約を満たす
- 前提
  - `/screen/summary` ルーターを呼び出せる。
- 操作
  - `summaryPage`、`start`、`size`、`tags`、`sort` に境界値や不正値を含むクエリを渡す。
- 期待結果
  - `start` と `size` は 1 以上の整数へ正規化される。
  - `tags` は `{ category, label }` の配列へ整形され、不正フォーマットは除外される。
  - `sort` は既知の列挙値へ解決され、未知値はデフォルトへフォールバックする。
