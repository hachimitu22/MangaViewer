# media_tagテーブル

## カラム一覧

| カラム名 | 型  | PK  |       FK       | NULL許可 | デフォルト |  コメント  |
| -------- | --- | --- | -------------- | -------- | ---------- | ---------- |
| media_id | int | o   | media.media_id | x        |            | メディアID |
| tag_id   | int | o   | tag.tag_id     | x        |            | タグID     |
