# contentテーブル

## カラム一覧

| カラム名 |  型  | PK  |       FK       | NULL許可 |   デフォルト   |    コメント    |
| -------- | ---- | --- | -------------- | -------- | -------------- | -------------- |
| content_id  | int  | o   |                | x        | AUTO_INCREMENT | コンテンツID     |
| media_id | int  |     | media.media_id | x        |                | メディアID     |
| path     | text |     |                | x        |                | コンテンツのパス |
| page     | int  |     |                | x        |                | ページ番号     |

## 制約
- ユニーク制約: media_id, page
  - 1メディアに同一のページ番号を許可しない
  - pageは1以上かつ連番であること

## インデックス
- media_id, page: ビューアーに表示するコンテンツを取得する用
