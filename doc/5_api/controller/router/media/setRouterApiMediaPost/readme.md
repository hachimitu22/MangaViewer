# router (POST /api/media)

## 概要
- `POST /api/media` のルーティング定義。
- ハンドラー順: `SessionAuthMiddleware` → `CsrfProtectionMiddleware` → `ContentSaveMiddleware` → `MediaPostController`。

## エラーハンドリング
- 認証失敗: `401`
- CSRF不一致 / Origin不一致: `403`
- 入力不正: `400`
- 想定外例外: `500`

## 関連
- [routerテストケース](/doc/5_api/controller/router/media/setRouterApiMediaPost/testcase.medium.md)
