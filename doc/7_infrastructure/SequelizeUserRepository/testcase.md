# SequelizeUserRepository テストケース

## テストケース一覧
- [save / findByUserId で favorite と queue を永続化できる](#save--findbyuserid-で-favorite-と-queue-を永続化できる)

---

### save / findByUserId で favorite と queue を永続化できる
- 前提
  - `SequelizeUserRepository` が初期化済みである
  - favorite / queue を持つ `User` 集約がある
- 操作
  - `save(user)` 実行後に `findByUserId(userId)` を呼ぶ
- 期待結果
  - favorite 一覧が保存順どおり復元される
  - queue 一覧が保存され復元される
  - 取得結果は `User` 集約として利用できる
