# contentテーブル

## カラム一覧

| カラム名   | 型   | PK  | FK             | NULL許可 | デフォルト | コメント                            |
| ---------- | ---- | --- | -------------- | -------- | ---------- | ----------------------------------- |
| content_id | text | o   |                | x        |            | コンテンツID（ContentIdの永続化値） |
| media_id   | int  |     | media.media_id | x        |            | メディアID                          |
| position   | int  |     |                | x        |            | 表示順                              |

## 制約
- ユニーク制約: media_id, position
  - 1メディアに同一の表示順を許可しない
  - positionは1以上かつ連番であること

## インデックス
- media_id, position: ビューアーに表示するコンテンツを順序付きで取得する用
