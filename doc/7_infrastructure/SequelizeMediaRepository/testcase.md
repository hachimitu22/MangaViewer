# SequelizeMediaRepository テストケース

## テストケース一覧
- [save で Media 集約を永続化できる](#save-で-media-集約を永続化できる)
- [findByMediaId で永続化済み Media 集約を復元できる](#findbymediaid-で永続化済み-media-集約を復元できる)
- [delete で対象メディアを削除できる](#delete-で対象メディアを削除できる)
- [findByMediaId は未登録IDで null を返す](#findbymediaid-は未登録idで-null-を返す)
- [save は Media 以外を受け取ると例外を送出する](#save-は-media-以外を受け取ると例外を送出する)
- [findByMediaId は MediaId 以外を受け取ると例外を送出する](#findbymediaid-は-mediaid-以外を受け取ると例外を送出する)
- [delete は Media 以外を受け取ると例外を送出する](#delete-は-media-以外を受け取ると例外を送出する)

---

### save で Media 集約を永続化できる
- 前提
  - 有効な Media 集約が存在する
- 操作
  - `save(media)` を実行する
- 期待結果
  - `media` / `content` / `media_tag` に対応データが保存される
  - `content.position` は 1 始まりで連番保存される

### findByMediaId で永続化済み Media 集約を復元できる
- 前提
  - Media 集約が `save` 済みである
- 操作
  - `findByMediaId(mediaId)` を実行する
- 期待結果
  - `Media` インスタンスが返る
  - タイトル・コンテンツ順・タグ・カテゴリー優先順が一致する

### delete で対象メディアを削除できる
- 前提
  - Media 集約が `save` 済みである
- 操作
  - `delete(media)` を実行する
- 期待結果
  - 対象 `media_id` が削除される
  - `findByMediaId(mediaId)` は `null` を返す

### findByMediaId は未登録IDで null を返す
- 前提
  - 指定 `media_id` は未登録である
- 操作
  - `findByMediaId(mediaId)` を実行する
- 期待結果
  - `null` が返る


### save は Media 以外を受け取ると例外を送出する
- 前提
  - リポジトリが生成済みである
- 操作
  - `save` に `Media` 以外の値を渡して実行する
- 期待結果
  - `Error` が送出される

### findByMediaId は MediaId 以外を受け取ると例外を送出する
- 前提
  - リポジトリが生成済みである
- 操作
  - `findByMediaId` に `MediaId` 以外の値を渡して実行する
- 期待結果
  - `Error` が送出される

### delete は Media 以外を受け取ると例外を送出する
- 前提
  - リポジトリが生成済みである
- 操作
  - `delete` に `Media` 以外の値を渡して実行する
- 期待結果
  - `Error` が送出される
