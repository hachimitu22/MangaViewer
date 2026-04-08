# LogoutPostController テストケース

## テスト観点
- 正常系: `LogoutService` 成功で `200 + { code: 0 }`。
- ビジネス失敗: `LogoutService` 失敗結果で `200 + { code: 1 }`。
- 入力不備: `session` 未設定で `401 + { message: '認証に失敗しました' }`。
- 例外: `500 + { message: 'Internal Server Error' }`。
- Cookie: `session_token` と `csrf_token` を clear する。

## 正常系
### ログアウト成功時はcode=0を返す
- **結果**:
  - `LogoutService` を呼ぶ。
  - `200` と `{ "code": 0 }` を返す。
  - `session_token` / `csrf_token` を clear する。

## 異常系
### ログアウト失敗時はcode=1を返す
- **前提**: `LogoutService` が失敗結果を返す。
- **結果**: `200` と `{ "code": 1 }` を返す。

### sessionが未設定の場合は401を返す
- **結果**:
  - `LogoutService` を呼ばない。
  - `401` と `{ "message": "認証に失敗しました" }` を返す。

### サービス例外時は500を返す
- **結果**: `500` と `{ "message": "Internal Server Error" }` を返す。
