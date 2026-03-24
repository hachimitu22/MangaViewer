# SessionStateRegistrar テストケース

## テストケース一覧
- [ログイン成功時にセッションIDをローテーションして session へ session_token を保存しストア登録できる](#ログイン成功時にセッションidをローテーションして-session-へ-session_token-を保存しストア登録できる)
- [execute の入力が不正な場合は例外となる](#execute-の入力が不正な場合は例外となる)
- [sessionTokenGenerator が空文字を返す場合は例外となる](#sessiontokengenerator-が空文字を返す場合は例外となる)
- [セッション再生成の完了後にストア保存と session_token 更新を行う](#セッション再生成の完了後にストア保存と-session_token-更新を行う)
- [express-session のように regenerate 後に req.session が差し替わる場合は新しい session に session_token を保存する](#express-session-のように-regenerate-後に-reqsession-が差し替わる場合は新しい-session-に-session_token-を保存する)
- [セッション再生成が失敗した場合はストア保存と session_token 更新を行わない](#セッション再生成が失敗した場合はストア保存と-session_token-更新を行わない)
- [非同期ストア保存が失敗した場合は session_token を更新しない](#非同期ストア保存が失敗した場合は-session_token-を更新しない)

---

### ログイン成功時にセッションIDをローテーションして session へ session_token を保存しストア登録できる
- 前提
  - `sessionStateStore.save` が成功する
  - `sessionTokenGenerator` が有効なトークンを返す
- 操作
  - `execute({ session, userId, ttlMs })` を実行する
- 期待結果
  - `session.regenerate` が呼ばれる
  - ストアに `sessionToken` / `userId` / `ttlMs` が保存される
  - `session.session_token` が更新される
  - ストアの戻り値がそのまま返る

### execute の入力が不正な場合は例外となる
- 前提
  - Registrar が生成済みである
- 操作
  - `session` が `null`、`session.regenerate` 欠落、`userId` 空文字などで `execute` を実行する
- 期待結果
  - `Error` で reject する

### sessionTokenGenerator が空文字を返す場合は例外となる
- 前提
  - `sessionTokenGenerator` が空文字を返す設定である
- 操作
  - `execute({ session, userId, ttlMs })` を実行する
- 期待結果
  - `sessionToken must be a non-empty string` で reject する

### セッション再生成の完了後にストア保存と session_token 更新を行う
- 前提
  - `session.regenerate` が非同期完了する
- 操作
  - `execute` 開始後、`regenerate` のコールバックを遅延実行する
- 期待結果
  - `regenerate` 完了前はストア保存も `session_token` 更新も行われない
  - 完了後に保存と更新が行われる

### express-session のように regenerate 後に req.session が差し替わる場合は新しい session に session_token を保存する
- 前提
  - `session.req.session` が `regenerate` 完了前後で新しいオブジェクトへ差し替わる
- 操作
  - `execute` を実行し、差し替え後に regenerate を完了させる
- 期待結果
  - 新しい `req.session` 側へ `session_token` が保存される
  - 元の `session` には `session_token` が保存されない

### セッション再生成が失敗した場合はストア保存と session_token 更新を行わない
- 前提
  - `session.regenerate` がエラーを返す
- 操作
  - `execute({ session, userId, ttlMs })` を実行する
- 期待結果
  - Promise が reject する
  - `sessionStateStore.save` は呼ばれない
  - `session_token` は更新されない

### 非同期ストア保存が失敗した場合は session_token を更新しない
- 前提
  - `session.regenerate` は成功する
  - `sessionStateStore.save` が reject する
- 操作
  - `execute({ session, userId, ttlMs })` を実行する
- 期待結果
  - Promise が reject する
  - `session_token` は更新されない
