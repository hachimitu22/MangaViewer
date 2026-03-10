# media_categoryテーブル

## カラム一覧

| カラム名    | 型  | PK  | FK                   | NULL許可 | デフォルト | コメント                    |
| ----------- | --- | --- | -------------------- | -------- | ---------- | --------------------------- |
| media_id    | int |     | media.media_id       | x        |            | メディアID                  |
| category_id | int |     | category.category_id | x        |            | カテゴリーID                |
| priority    | int |     |                      | x        |            | カテゴリー優先順（1始まり） |

## 制約
- ユニーク制約: media_id, category_id, priority
  - 同一メディアに同一カテゴリー優先順を重複登録しない

## インデックス
- media_id, priority: 優先カテゴリーを順序付きで復元する用
