# router (PATCH /api/media/:mediaId)

## 概要
- `PATCH /api/media/:mediaId` のルーティング定義。
- ハンドラー順: `GuardMiddleware` → `CsrfProtectionMiddleware` → `ContentSaveMiddleware` → `MediaPatchController`。

## エラーハンドリング
- 前段ガード失敗: `401`
- CSRF不一致 / Origin不一致: `403`
- 入力不正: `400`
- 想定外例外: `500`

## 関連
- [routerテストケース](/doc/5_api/controller/router/media/setRouterApiMediaPatch/testcase.medium.md)
