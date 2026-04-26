# router (GET /)

## 概要
- ルートパス `/` へのアクセス時に、公開導線としてメディア一覧画面へ遷移させるルーティング定義を担当する。
- 遷移先は常に `/screen/summary` へ統一する。

## 対象
- `GET /`

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。

## ルーティングフロー
1. `GET /` を受け付ける。
2. 常に `/screen/summary` へリダイレクトする。

## エラーハンドリング
- 追加の分岐は持たない（`res.redirect('/screen/summary')` のみ）。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterRootGet/testcase.medium.md)
- [OpenAPI: root path](/doc/5_api/openapi/paths/screen/root.yaml)
- [setupRoutes 設計書](/doc/5_api/controller/router/setupRoutes/readme.md)
