# SequelizeUserRepository テストケース

## テストケース一覧
- [sync で未指定 models の user / favorite / queue テーブルを初期化できる](#sync-で未指定-models-の-user--favorite--queue-テーブルを初期化できる)
- [findByUserId は未登録 user_id に対して空の User 集約を返す](#findbyuserid-は未登録-user_id-に対して空の-user-集約を返す)
- [save は既存 user の favorite / queue を空データ更新で置き換える](#save-は既存-user-の-favorite--queue-を空データ更新で置き換える)
- [save / findByUserId は不正引数で例外を送出する](#save--findbyuserid-は不正引数で例外を送出する)

---

### sync で未指定 models の user / favorite / queue テーブルを初期化できる
- 前提
  - `sequelize` と `unitOfWorkContext` を注入してリポジトリを生成する
- 操作
  - `sync()` を実行する
- 期待結果
  - `user` / `favorite` / `queue` テーブルが作成される

### findByUserId は未登録 user_id に対して空の User 集約を返す
- 前提
  - 指定 `user_id` は未登録である
- 操作
  - `findByUserId(userId)` を実行する
- 期待結果
  - 指定した `userId` を持つ `User` 集約が返る
  - `favorites` / `queue` は空配列である

### save は既存 user の favorite / queue を空データ更新で置き換える
- 前提
  - favorite / queue を持つ `User` が保存済みである
- 操作
  - 同一 `user_id` へ favorites / queue が空の `User` を再度 `save` する
- 期待結果
  - 既存 favorite / queue が削除され、再取得時は空配列になる

### save / findByUserId は不正引数で例外を送出する
- 前提
  - リポジトリが生成済みである
- 操作
  - `User` / `UserId` 以外の値を各メソッドへ渡して実行する
- 期待結果
  - `Error` が送出される
