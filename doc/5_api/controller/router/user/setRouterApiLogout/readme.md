# router (POST /api/logout)

## 概要
- `POST /api/logout` のルーティング定義。
- ハンドラー順: `SessionAuthMiddleware` → `CsrfProtectionMiddleware` → `LogoutPostController`。

## エラーハンドリング
- 認証失敗: `401`
- CSRF不一致 / Origin不一致: `403`
- それ以外: `LogoutPostController` のレスポンス仕様（`200/401/500`）に従う。

## 関連
- [routerテストケース](/doc/5_api/controller/router/user/setRouterApiLogout/testcase.medium.md)
