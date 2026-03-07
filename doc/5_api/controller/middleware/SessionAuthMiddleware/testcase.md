# SessionAuthMiddleware テストケース

## テストケース一覧
- [sessionIdが有効でuserIdを解決できる場合はnextへ委譲する](#sessionidが有効でuseridを解決できる場合はnextへ委譲する)
- [request.contextが未作成でも初期化してuserIdを設定できる](#requestcontextが未作成でも初期化してuseridを設定できる)
- [userIdが必要ないController向けではuserId設定なしで委譲できる](#useridが必要ないcontroller向けではuserid設定なしで委譲できる)
- [sessionIdが未指定の場合は401を返す](#sessionidが未指定の場合は401を返す)
- [sessionIdが期限切れの場合は401を返す](#sessionidが期限切れの場合は401を返す)
- [sessionIdの形式が不正な場合は401を返す](#sessionidの形式が不正な場合は401を返す)
- [sessionIdの署名が不一致の場合は401を返す](#sessionidの署名が不一致の場合は401を返す)
- [sessionIdに対応するセッションがストア未存在の場合は401を返す](#sessionidに対応するセッションがストア未存在の場合は401を返す)
- [sessionIdが明示失効済みの場合は401を返す](#sessionidが明示失効済みの場合は401を返す)
- [sessionIdは有効でもuserIdを解決できない場合は401を返す](#sessionidは有効でもuseridを解決できない場合は401を返す)
- [認証失敗時レスポンスはUnauthorizedApi準拠を維持する](#認証失敗時レスポンスはunauthorizedapi準拠を維持する)
- [認証失敗時はrequest.context.userIdを設定しない](#認証失敗時はrequestcontextuseridを設定しない)
- [認証失敗時ログはsessionId生値を出力しない](#認証失敗時ログはsessionid生値を出力しない)

---

## 正常系

### sessionIdが有効でuserIdを解決できる場合はnextへ委譲する

- **前提**
  - Cookie に `sessionId` が設定されている。
  - `sessionId` は有効（期限内・形式正当・署名一致・失効なし・ストア存在）である。
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
  - Cookie の `sessionId` は有効であり、`userId` を解決できる。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - ミドルウェア内で `request.context` が初期化される。
  - `request.context.userId` に空文字ではない `string` が設定される。
  - 後続処理へ `next` で委譲する。

---

### userIdが必要ないController向けではuserId設定なしで委譲できる

- **前提**
  - Cookie の `sessionId` は有効である。
  - 後続 Controller が `userId` を要求しない仕様である。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - 認証成功として後続処理へ委譲する。
  - `userId` 必須Controllerではないため、`request.context.userId` 設定が不要でも処理継続できる。

---

## 異常系

### sessionIdが未指定の場合は401を返す

- **前提**
  - Cookie に `sessionId` が存在しない。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### sessionIdが期限切れの場合は401を返す

- **前提**
  - Cookie の `sessionId` は期限切れである。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### sessionIdの形式が不正な場合は401を返す

- **前提**
  - Cookie の `sessionId` が想定形式に一致しない。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### sessionIdの署名が不一致の場合は401を返す

- **前提**
  - Cookie の `sessionId` の署名検証に失敗する。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### sessionIdに対応するセッションがストア未存在の場合は401を返す

- **前提**
  - Cookie の `sessionId` は形式上正しい。
  - セッションストアに該当セッションが存在しない。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### sessionIdが明示失効済みの場合は401を返す

- **前提**
  - Cookie の `sessionId` は失効リストに登録済みである。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - 後続処理へ委譲しない。

---

### sessionIdは有効でもuserIdを解決できない場合は401を返す

- **前提**
  - Cookie の `sessionId` は有効である。
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
  - 認証失敗条件（未指定 / 無効 / 期限切れ / `userId` 解決不能）のいずれかを満たす。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - HTTPステータス `401` を返す。
  - `Content-Type: application/json` を返す。
  - レスポンスボディは `{ "message": "認証に失敗しました" }` 形式を満たす。

---

### 認証失敗時はrequest.context.userIdを設定しない

- **前提**
  - 認証失敗条件（未指定 / 無効 / 期限切れ / `userId` 解決不能）のいずれかを満たす。
- **操作**
  - `SessionAuthMiddleware` を実行する。
- **結果**
  - `request.context.userId` は未設定のままである。
  - 既存値がある場合は上書きしない。

---

### 認証失敗時ログはsessionId生値を出力しない

- **前提**
  - 認証失敗が発生する。
- **操作**
  - `SessionAuthMiddleware` を実行し、ログ出力を確認する。
- **結果**
  - `sessionId` の生値はログに出力されない。
  - 失敗理由は種別（例: `expired` / `invalid-signature`）で記録される。

