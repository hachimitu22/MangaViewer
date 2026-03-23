# SequelizeMediaRepository テストケース

## テストケース一覧
- [sync で未指定 models のテーブルを初期化できる](#sync-で未指定-models-のテーブルを初期化できる)
- [空の content / tag / priorityCategories を持つ Media も保存して復元できる](#空の-content--tag--prioritycategories-を持つ-media-も保存して復元できる)
- [存在しない media_id の findByMediaId は null、delete は例外なく完了する](#存在しない-media_id-の-findbymediaid-は-nulldelete-は例外なく完了する)
- [save は既存メディア更新時に古い関連を置き換える](#save-は既存メディア更新時に古い関連を置き換える)
- [save / findByMediaId / delete は不正引数で例外を送出する](#save--findbymediaid--delete-は不正引数で例外を送出する)
- [Service境界で開始した実行文脈を使って rollback できる](#service境界で開始した実行文脈を使って-rollback-できる)

---

### sync で未指定 models のテーブルを初期化できる
- 前提
  - `sequelize` と `unitOfWorkContext` を注入してリポジトリを生成する
- 操作
  - `sync()` を実行する
- 期待結果
  - `media` / `content` / `category` / `tag` / `media_tag` / `media_category` テーブルが作成される

### 空の content / tag / priorityCategories を持つ Media も保存して復元できる
- 前提
  - `contents` / `tags` / `priorityCategories` が空配列の `Media` 集約が存在する
- 操作
  - `save(media)` 実行後に `findByMediaId(mediaId)` を呼ぶ
- 期待結果
  - `Media` が復元される
  - `contents` / `tags` / `priorityCategories` は空配列のまま保持される

### 存在しない media_id の findByMediaId は null、delete は例外なく完了する
- 前提
  - 指定 `media_id` は未登録である
- 操作
  - `findByMediaId(mediaId)` と `delete(media)` を実行する
- 期待結果
  - `findByMediaId` は `null` を返す
  - `delete` は不要な例外を送出しない

### save は既存メディア更新時に古い関連を置き換える
- 前提
  - 同一 `media_id` の `Media` を再保存できる状態である
- 操作
  - `save` で初回保存した後、タイトル・コンテンツ・タグ・優先カテゴリーを変更した `Media` を再度 `save` する
- 期待結果
  - 取得結果は更新後の値だけを保持する
  - 古い `content` / `media_tag` / `media_category` は残らない

### save / findByMediaId / delete は不正引数で例外を送出する
- 前提
  - リポジトリが生成済みである
- 操作
  - 各メソッドへ期待型以外の値を渡して実行する
- 期待結果
  - `Error` が送出される

### Service境界で開始した実行文脈を使って rollback できる
- 前提
  - リポジトリが生成済みである
  - 呼び出し側で開始した実行文脈がある
- 操作
  - `unitOfWork.run(async () => { ... })` 内で `save(media)` を実行し、その後例外を送出する
- 期待結果
  - 実行文脈内では保存した `Media` が取得できる
  - 例外後は rollback され、文脈外からは `null` になる
