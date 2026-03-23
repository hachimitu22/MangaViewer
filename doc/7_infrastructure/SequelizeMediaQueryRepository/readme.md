# SequelizeMediaQueryRepository 設計書

## 概要
`SequelizeMediaQueryRepository` は、メディア一覧・検索画面向けの読み取り専用クエリーを Sequelize で実装したリポジトリです。  
タイトル条件、タグ条件、ソート条件、ページング条件をもとにメディアIDを絞り込み、サムネイル・タグ・優先カテゴリーを含む `SearchResult` を構築します。

## クラス
- 配置: `src/infrastructure/SequelizeMediaQueryRepository.js`
- クラス名: `SequelizeMediaQueryRepository`
- 継承: `IMediaQueryRepository`

## 公開メソッド
- `search(condition)`
  - `SearchCondition` に基づいて検索結果と総件数を返す
  - 絞り込み -> ページング -> 概要復元の順で処理する
- `findOverviewsByMediaIds(mediaIds)`
  - 指定メディアID配列から `MediaOverview[]` を構築する
  - 空配列なら空配列を返す

## 検索方針
- タイトル条件は `media.title LIKE %title%` で部分一致検索する
- タグ条件は `category` と `tag` を順に解決し、各タグ条件を満たす `media_id` に絞り込む
- `totalCount` は条件一致した全メディア件数で、ページング前の件数を返す
- ページングは `start` / `size` を使って `offset` / `limit` に変換する
- ソートは `SortType` ごとにタイトル順・擬似作成順・ランダム順を切り替える

## 概要復元方針
- 先頭 `content` をサムネイルとして採用する
- タグは `MediaOverviewTag` に変換し、`priorityCategories` を優先した順序で並べ替える
- `priorityCategories` にないタグはカテゴリ名・ラベル名のロケール比較で整列する
- `findOverviewsByMediaIds` の返却順は、引数 `mediaIds` の順序を維持する

## バリデーション方針
- `constructor` は `sequelize.random` を持つ Sequelize 互換オブジェクトを必須とする
- `search` は `SearchCondition` インスタンスのみ受け付ける
- `findOverviewsByMediaIds` は文字列または Sequelize row から `media_id` を抽出できる配列のみ受け付ける

## エラー方針
- 入力バリデーション違反は `Error` を送出する
- Sequelize クエリー失敗は握り潰さず上位へ伝播する
