# userテーブル

## カラム一覧

|   カラム名    |    型    | PK  | FK  | NULL許可 |    デフォルト     |      コメント      |
| ------------- | -------- | --- | --- | -------- | ----------------- | ------------------ |
| user_id       | int      | o   |     | x        | AUTO_INCREMENT    | ユーザID           |
| username      | text     |     |     | x        |                   | ユーザ名           |
| password_hash | text     |     |     | x        |                   | パスワードハッシュ |
| created_at    | datetime |     |     | x        | CURRENT_TIMESTAMP | 作成日時           |
| updated_at    | datetime |     |     | x        | CURRENT_TIMESTAMP | 更新日時           |

## 制約
- ユニーク制約: username

## インデックス
- username: ユーザーが入力したユーザー名をキーにユーザー情報を検索するため。
