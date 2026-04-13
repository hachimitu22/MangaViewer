# LogoutPostController

## 概要
- `POST /api/logout` を受け取り、`LogoutService` へ委譲する。
- 認証・CSRF検証は前段ミドルウェアで完了している前提。
- ログアウト時は `session_token` と `csrf_token` をクリアする。

## レスポンス仕様
- ログアウト成功: `200 + { code: 0 }`
- ログアウト失敗結果: `200 + { code: 1 }`
- `session` 未設定: `401 + { message: '認証に失敗しました' }`
- 例外: `500 + { message: 'Internal Server Error' }`

## 関連
- [Controllerテストケース](/doc/5_api/controller/api/LogoutPostController/testcase.medium.md)
