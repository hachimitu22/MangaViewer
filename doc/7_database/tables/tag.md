# tagテーブル

## カラム一覧

|  カラム名   |  型  | PK  |          FK          | NULL許可 |   デフォルト   |  コメント  |
| ----------- | ---- | --- | -------------------- | -------- | -------------- | ---------- |
| tag_id      | int  | o   |                      | x        | AUTO_INCREMENT | タグID     |
| category_id | int  |     | category.category_id | x        |                | カテゴリID |
| name        | text |     |                      | x        |                | タグ名     |

## 制約
- ユニーク制約: category_id, name
  - 同一カテゴリーに同一タグ名を禁止する
