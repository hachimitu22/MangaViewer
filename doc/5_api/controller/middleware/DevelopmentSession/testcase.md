# DevelopmentSession テストケース

## テストケース一覧
- [固定セッション設定が揃っていると有効と判定する](#固定セッション設定が揃っていると有効と判定する)
- [固定セッション設定のいずれかが欠けると無効と判定する](#固定セッション設定のいずれかが欠けると無効と判定する)
- [対象パスのみ固定セッションを補完対象と判定する](#対象パスのみ固定セッションを補完対象と判定する)
- [固定セッションが無効な場合は対象パスでも補完対象にしない](#固定セッションが無効な場合は対象パスでも補完対象にしない)

---

## 正常系

### 固定セッション設定が揃っていると有効と判定する

- **対応テスト**
  - `__tests__/small/app/developmentSession.test.js`
  - `固定セッション設定が揃っていると有効と判定する`
- **前提**
  - `devSessionToken` に空文字ではない `string` が設定されている。
  - `devSessionUserId` に空文字ではない `string` が設定されている。
  - `devSessionTtlMs` に正の整数が設定されている。
- **操作**
  - `hasDevelopmentSession(env)` を実行する。
- **結果**
  - 戻り値は `true` になる。

---

### 対象パスのみ固定セッションを補完対象と判定する

- **対応テスト**
  - `__tests__/small/app/developmentSession.test.js`
  - `対象パスのみ固定セッションを補完対象と判定する`
- **前提**
  - `hasDevelopmentSession(env)` が `true` となる固定セッション設定が存在する。
  - `devSessionPaths` に `/screen/entry` と `/api/media` が設定されている。
- **操作**
  - `shouldApplyDevelopmentSession({ env, requestPath })` を、`/screen/entry`、`/api/media`、`/unknown` でそれぞれ実行する。
- **結果**
  - `/screen/entry` は `true` になる。
  - `/api/media` は `true` になる。
  - `/unknown` は `false` になる。

---

## 準正常系 / 異常系

### 固定セッション設定のいずれかが欠けると無効と判定する

- **対応テスト**
  - 未実装（追加候補）
- **前提**
  - 以下のいずれかが成り立つ。
    - `devSessionToken` が未設定・空文字である。
    - `devSessionUserId` が未設定・空文字である。
    - `devSessionTtlMs` が未設定・`0`・負数・整数以外である。
- **操作**
  - `hasDevelopmentSession(env)` を実行する。
- **結果**
  - 戻り値は `false` になる。
  - `createDependencies` は固定セッションを事前登録しない。
  - `server.js` は固定セッション有効化ログを出力しない。

---

### 固定セッションが無効な場合は対象パスでも補完対象にしない

- **対応テスト**
  - 未実装（追加候補）
- **前提**
  - `requestPath` は `devSessionPaths` に含まれている。
  - ただし `hasDevelopmentSession(env)` は `false` である。
- **操作**
  - `shouldApplyDevelopmentSession({ env, requestPath })` を実行する。
- **結果**
  - 戻り値は `false` になる。
  - `setupMiddleware` は `req.session.session_token` を自動補完しない。

