# queueテーブル

## カラム一覧

| カラム名 |    型    | PK  |       FK       | NULL許可 |    デフォルト     |  コメント  |
| -------- | -------- | --- | -------------- | -------- | ----------------- | ---------- |
| queue_id | int      | o   |                | x        | AUTO_INCREMENT    | キューID   |
| user_id  | int      |     | user.user_id   | x        |                   | ユーザID   |
| media_id | int      |     | media.media_id | x        |                   | メディアID |
| added_at | datetime |     |                | x        | CURRENT_TIMESTAMP | 追加日時   |

## 制約
- ユニーク制約：(user_id, media_id)
  - 1ユーザーが1メディアを複数回あとで見るに追加することを禁止する
