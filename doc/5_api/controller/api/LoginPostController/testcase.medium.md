# LoginPostController テストケース

## テスト観点
- 正常系: ログイン成功時に Cookie と `code=0` を返す。
- 入力不備: `username` / `password` / `session` の不備でサービスを呼ばず `code=1` を返す。
- サービス失敗: 認証失敗結果を `code=1` で返す。
- 想定外例外: `LoginService` 例外時も失敗レスポンス形式を維持する。

## 正常系

### ログイン成功時はcookie付きでcode=0を返す
- **前提**
  - `username` と `password` が空文字ではない `string`。
  - `session` が存在する。
  - `LoginService` が `LoginSucceededResult` を返し、`sessionToken` を持つ。
- **操作**
  - `LoginPostController.execute` を実行する。
- **結果**
  - `LoginService` に `username` / `password` / `session` を渡して呼び出す。
  - `session_token` Cookie を `httpOnly: true`, `path: '/'` で設定する。
  - HTTPステータス `200` と `{"code":0}` を返す。

## 異常系

### ログイン失敗時はcookieを発行せずcode=1を返す
- **前提**
  - 入力値はすべて有効である。
  - `LoginService` が失敗結果を返す。
- **操作**
  - `LoginPostController.execute` を実行する。
- **結果**
  - Cookie を発行しない。
  - HTTPステータス `200` と `{"code":1}` を返す。

### usernameが未設定の場合はcode=1を返す
- **前提**
  - `req.body.username` が未設定である。
- **操作**
  - `LoginPostController.execute` を実行する。
- **結果**
  - `LoginService` を呼び出さない。
  - Cookie を発行せず、HTTPステータス `200` と `{"code":1}` を返す。

### usernameが空文字の場合はcode=1を返す
- **前提**
  - `req.body.username` が空文字である。
- **操作 / 結果**
  - 上記と同様に `LoginService` を呼び出さず `code=1` を返す。

### passwordが未設定の場合はcode=1を返す
- **前提**
  - `req.body.password` が未設定である。
- **操作 / 結果**
  - `LoginService` を呼び出さず、HTTPステータス `200` と `{"code":1}` を返す。

### passwordが空文字の場合はcode=1を返す
- **前提**
  - `req.body.password` が空文字である。
- **操作 / 結果**
  - `LoginService` を呼び出さず、HTTPステータス `200` と `{"code":1}` を返す。

### sessionが未設定の場合はcode=1を返す
- **前提**
  - `req.session` が未設定である。
- **操作 / 結果**
  - `LoginService` を呼び出さず、HTTPステータス `200` と `{"code":1}` を返す。

### サービス例外時もcode=1を返す
- **前提**
  - 入力値はすべて有効である。
  - `LoginService.execute` が例外を送出する。
- **操作**
  - `LoginPostController.execute` を実行する。
- **結果**
  - HTTPステータス `200` と `{"code":1}` を返す。
  - 想定外例外がそのまま外へ送出されない。
