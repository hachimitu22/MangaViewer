# router (DELETE /api/media/:mediaId)

## 概要
- `DELETE /api/media/:mediaId` のルーティング定義。
- ハンドラー順: `GuardMiddleware` → `CsrfProtectionMiddleware` → `MediaDeleteController`。

## エラーハンドリング
- 前段ガード失敗: `401`
- CSRF不一致 / Origin不一致: `403`
- 入力不正: `400`
- 想定外例外: `500`

## 関連
- [routerテストケース](/doc/5_api/controller/router/media/setRouterApiMediaDelete/testcase.medium.md)
