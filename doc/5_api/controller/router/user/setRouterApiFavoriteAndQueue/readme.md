# router (favorite / queue API)

## 概要
- `PUT/DELETE /api/favorite/:mediaId`、`PUT/DELETE /api/queue/:mediaId` のルーティング定義。
- 各ルートの順序: `SessionAuthMiddleware` → `CsrfProtectionMiddleware` → ハンドラー。

## エラーハンドリング
- 認証失敗: `401`
- CSRF不一致 / Origin不一致: `403`
- サービス例外: `next(error)` に委譲

## 関連
- [routerテストケース](/doc/5_api/controller/router/user/setRouterApiFavoriteAndQueue/testcase.medium.md)
