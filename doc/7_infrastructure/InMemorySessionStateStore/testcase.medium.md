# InMemorySessionStateStore テストケース

## テストケース一覧
- [save したセッショントークンから userId を取得できる](#save-したセッショントークンから-userid-を取得できる)
- [TTL を過ぎたセッションは取得時に自動削除される](#ttl-を過ぎたセッションは取得時に自動削除される)
- [delete は対象セッションを削除できる](#delete-は対象セッションを削除できる)
- [purgeExpired は期限切れセッションのみ削除する](#purgeexpired-は期限切れセッションのみ削除する)
- [save の入力が不正な場合は例外となる](#save-の入力が不正な場合は例外となる)

---

### save したセッショントークンから userId を取得できる
- 前提
  - 空でない `sessionToken` / `userId` と正の `ttlMs` がある
- 操作
  - `save` 実行後に `findUserIdBySessionToken(sessionToken)` を呼ぶ
- 期待結果
  - 保存した `userId` を取得できる

### TTL を過ぎたセッションは取得時に自動削除される
- 前提
  - TTL 付きセッションが保存済みである
  - `clock` を進めて有効期限に到達または超過させる
- 操作
  - `findUserIdBySessionToken(sessionToken)` を呼ぶ
- 期待結果
  - `undefined` が返る
  - 対象セッションは内部ストアから削除される

### delete は対象セッションを削除できる
- 前提
  - セッションが保存済みである
- 操作
  - `delete(sessionToken)` を実行する
- 期待結果
  - `true` が返る
  - 以後 `findUserIdBySessionToken(sessionToken)` は `undefined` を返す

### purgeExpired は期限切れセッションのみ削除する
- 前提
  - 期限切れになるセッションと、まだ有効なセッションが混在して保存されている
- 操作
  - 時刻を進めたあと `purgeExpired()` を実行する
- 期待結果
  - 期限切れセッションのみ削除される
  - 有効期限内セッションは保持される

### save の入力が不正な場合は例外となる
- 前提
  - ストアが生成済みである
- 操作
  - `sessionToken` 空文字、`userId` 空文字、`ttlMs` 0 以下など不正値で `save` を実行する
- 期待結果
  - `Error` が送出される
