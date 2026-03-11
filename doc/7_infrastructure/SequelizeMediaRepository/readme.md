# SequelizeMediaRepository 設計書

## 概要
`SequelizeMediaRepository` は `IMediaRepository` の RDB 実装です。  
永続化には Sequelize を利用し、Media 集約を以下のテーブルへ分解して保存します。

- `media`: メディア本体（ID・タイトル）
- `content`: ページ順コンテンツ
- `category`: カテゴリー名マスタ
- `tag`: カテゴリー配下のタグ名
- `media_tag`: メディアとタグの関連
- `media_category`: メディアごとのカテゴリー優先順

## クラス
- 配置: `src/infrastructure/SequelizeMediaRepository.js`
- クラス名: `SequelizeMediaRepository`
- 継承: `IMediaRepository`

## 公開メソッド
- `save(media, transaction = null)`
  - Media 集約を upsert する
  - 既存の `content` / `media_tag` は削除して再作成する
- `findByMediaId(mediaId, transaction = null)`
  - `media_id` をキーに集約を再構築する
  - 未存在の場合は `null` を返す
- `delete(media, transaction = null)`
  - 指定メディアIDを削除する
- `sync()`
  - テスト用補助。Sequelize モデルを同期する

## 保存方針
- `content.page` は `Media#getContents()` の順序を 1 始まりで保存する
- `media_category.priority` は `Media#getPriorityCategories()` の配列順を 1 始まりで保存する
- 同一カテゴリ・同一ラベルのタグは `tag(category_id, name)` のユニーク制約で再利用する
- 保存処理は呼び出し側から渡されたトランザクションに参加して実行できる（未指定時は自動コミット）

## 復元方針
- `content` は `page ASC` で `ContentId` に復元する
- `media_tag` からタグを取得し、`Tag(Category, Label)` を再構築する
- `media_category.priority ASC` の並びから `priorityCategories` を復元し `Media` を生成する

## エラー方針
- 引数がドメイン型でない場合は `Error` を送出する
- Sequelize 由来の例外は握り潰さず上位へ伝播する
