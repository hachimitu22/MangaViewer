# mediaテーブル

## カラム一覧

|  カラム名  |    型    | PK  | FK  | NULL許可 |    デフォルト     |  コメント  |
| ---------- | -------- | --- | --- | -------- | ----------------- | ---------- |
| media_id   | int      | o   |     | x        | AUTO_INCREMENT    | メディアID |
| title      | text     |     |     | x        |                   | タイトル   |
| created_at | datetime |     |     | x        | CURRENT_TIMESTAMP | 作成日時   |
| updated_at | datetime |     |     | x        | CURRENT_TIMESTAMP | 更新日時   |

## インデックス
- created_at DESC: 登録が新しい順、登録が古い順の検索用
- title ASC, created_at DESC: タイトル名での検索用
