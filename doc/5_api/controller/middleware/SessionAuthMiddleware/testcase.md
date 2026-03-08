# SessionAuthMiddleware テストケース

## テストケース一覧
- [session_tokenが有効でuserIdを解決できる場合はnextへ委譲する](#session_tokenが有効でuseridを解決できる場合はnextへ委譲する)
- [request.contextが未作成でも初期化してuserIdを設定できる](#requestcontextが未作成でも初期化してuseridを設定できる)
- [userIdが必要ないController向けではuserId設定なしで委譲できる](#useridが必要ないcontroller向けではuserid設定なしで委譲できる)
- [express-sessionでreq.sessionが未生成の場合は401を返す](#express-sessionでreqsessionが未生成の場合は401を返す)
- [session_tokenが未設定の場合は401を返す](#session_tokenが未設定の場合は401を返す)
- [session_tokenがstring以外の場合は401を返す](#session_tokenがstring以外の場合は401を返す)
- [session_tokenが空文字の場合は401を返す](#session_tokenが空文字の場合は401を返す)
- [session_tokenが期限切れの場合は401を返す](#session_tokenが期限切れの場合は401を返す)
- [session_tokenの形式が不正な場合は401を返す](#session_tokenの形式が不正な場合は401を返す)
- [session_tokenの署名が不一致の場合は401を返す](#session_tokenの署名が不一致の場合は401を返す)
- [session_tokenに対応するセッションがストア未存在の場合は401を返す](#session_tokenに対応するセッションがストア未存在の場合は401を返す)
- [session_tokenが明示失効済みの場合は401を返す](#session_tokenが明示失効済みの場合は401を返す)
- [session_tokenは有効でもuserIdを解決できない場合は401を返す](#session_tokenは有効でもuseridを解決できない場合は401を返す)
- [認証失敗時レスポンスはUnauthorizedApi準拠を維持する](#認証失敗時レスポンスはunauthorizedapi準拠を維持する)
- [認証失敗時はrequest.context.userIdを設定しない](#認証失敗時はrequestcontextuseridを設定しない)

---

## 正常系

### session_tokenが有効でuserIdを解決できる場合はnextへ委譲する

- **前提**
  - Express + `express-session` が有効化されており `req.session` が生成される。
  - `req.session.session_token` に `string` のトークンが設定されている。
  - `session_token` は有効（期限内・形式正当・署名一致・失効なし・ストア存在）である。
  - セッション情報から `userId` を解決できる。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - `request.context.userId` に空文字ではない `string` が設定される。
  - 後続処理へ `next` で委譲する。
  - `401` レスポンスを返さない。

---

### request.contextが未作成でも初期化してuserIdを設定できる

- **前提**
  - リクエストに `request.context` が存在しない。
  - `req.session.session_token` は有効であり、`userId` を解決できる。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - ミドルウェア内で `request.context` が初期化される。
  - `request.context.userId` に空文字ではない `string` が設定される。
  - 後続処理へ `next` で委譲する。

---

### userIdが必要ないController向けではuserId設定なしで委譲できる

- **前提**
  - `req.session.session_token` は有効である。
  - 後続 Controller が `userId` を要求しない仕様である。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - 認証成功として後続処理へ委譲する。
  - `userId` 必須 Controller ではないため、`request.context.userId` 設定が不要でも処理継続できる。

---

## 異常系

### express-sessionでreq.sessionが未生成の場合は401を返す

- **前提**
  - `express-session` が未適用、または異常により `req.session` が未生成である。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### session_tokenが未設定の場合は401を返す

- **前提**
  - `req.session` は存在するが `req.session.session_token` が存在しない。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### session_tokenがstring以外の場合は401を返す

- **前提**
  - `req.session.session_token` が `string` 以外（`number` / `object` / `null`）である。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### session_tokenが空文字の場合は401を返す

- **前提**
  - `req.session.session_token` が空文字である。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### session_tokenが期限切れの場合は401を返す

- **前提**
  - `req.session.session_token` は期限切れである。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### session_tokenの形式が不正な場合は401を返す

- **前提**
  - `req.session.session_token` が想定形式に一致しない。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### session_tokenの署名が不一致の場合は401を返す

- **前提**
  - `req.session.session_token` の署名検証に失敗する。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### session_tokenに対応するセッションがストア未存在の場合は401を返す

- **前提**
  - `req.session.session_token` は形式上正しい。
  - セッションストアに該当セッションが存在しない。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### session_tokenが明示失効済みの場合は401を返す

- **前提**
  - `req.session.session_token` は失効リストに登録済みである。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### session_tokenは有効でもuserIdを解決できない場合は401を返す

- **前提**
  - `req.session.session_token` は有効である。
  - セッション情報が破損しており `userId` を解決できない。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - `request.context.userId` を設定しない。
  - 後続処理へ委譲しない。

---

### 認証失敗時レスポンスはUnauthorizedApi準拠を維持する

- **前提**
  - 認証失敗条件（`req.session` 未生成 / `session_token` 不正 / `userId` 解決不能）のいずれかを満たす。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - `Content-Type: application/json` を返す。
  - レスポンスボディは `{ "message": "認証に失敗しました" }` 形式を満たす。

---

### 認証失敗時はrequest.context.userIdを設定しない

- **前提**
  - 認証失敗条件（`req.session` 未生成 / `session_token` 不正 / `userId` 解決不能）のいずれかを満たす。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - `request.context.userId` は未設定のままである。
  - 既存値がある場合は上書きしない。

