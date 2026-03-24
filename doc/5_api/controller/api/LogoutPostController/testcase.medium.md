# LogoutPostController テストケース

## テスト観点
- 正常系: `session` がある場合に `LogoutService` を呼び出し `code=0` を返す。
- 入力不備: `session` 未設定時は `code=1` を返す。
- サービス失敗: `LogoutService` の失敗結果を `code=1` で返す。
- 想定外例外: `LogoutService` 例外時も失敗レスポンス形式を維持する。

## 正常系

### ログアウト成功時はcode=0を返す
- **前提**
  - `req.session` が存在する。
  - `LogoutService` が成功結果を返す。
- **操作**
  - `LogoutPostController.execute` を実行する。
- **結果**
  - `LogoutService` に `session` を渡して呼び出す。
  - HTTPステータス `200` と `{"code":0}` を返す。

## 異常系

### ログアウト失敗時はcode=1を返す
- **前提**
  - `req.session` が存在する。
  - `LogoutService` が失敗結果を返す。
- **操作**
  - `LogoutPostController.execute` を実行する。
- **結果**
  - HTTPステータス `200` と `{"code":1}` を返す。

### sessionが未設定の場合はcode=1を返す
- **前提**
  - `req.session` が未設定である。
- **操作**
  - `LogoutPostController.execute` を実行する。
- **結果**
  - `LogoutService` を呼び出さない。
  - HTTPステータス `200` と `{"code":1}` を返す。

### サービス例外時もcode=1を返す
- **前提**
  - `req.session` が存在する。
  - `LogoutService.execute` が例外を送出する。
- **操作**
  - `LogoutPostController.execute` を実行する。
- **結果**
  - HTTPステータス `200` と `{"code":1}` を返す。
  - 想定外例外がそのまま外へ送出されない。
