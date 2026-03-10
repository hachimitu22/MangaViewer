# media_tagテーブル

## カラム一覧

| カラム名    | 型  | PK  | FK                   | NULL許可 | デフォルト | コメント                                             |
| ----------- | --- | --- | -------------------- | -------- | ---------- | ---------------------------------------------------- |
| media_id    | int |     | media.media_id       | x        |            | メディアID                                           |
| category_id | int |     | category.category_id | x        |            | 優先カテゴリーID                                     |
| tag_id      | int |     | tag.tag_id           | o        |            | タグID（カテゴリー優先順のみを表す行ではNULLを許可） |
| priority    | int |     |                      | x        |            | カテゴリー優先順（1始まり）                          |

## 制約
- ユニーク制約: media_id, category_id, tag_id
  - 同じメディアに同一タグを重複登録しない
- ユニーク制約: media_id, category_id, priority
  - 同じメディアで同一優先順位に同一カテゴリーを重複登録しない

## インデックス
- media_id, priority: 優先カテゴリーの復元順を担保する取得用
