# router (GET /screen/detail/:mediaId)

## 概要
- 詳細画面表示用のルーティング定義を担当する。
- 認証後に詳細取得サービスを呼び出し、`screen/detail` を描画する。
- Node.js / Express の `router.get` に対して、`認証ミドルウェア` → `ScreenDetailGetController` の順でハンドラーを設定する。

## 対象
- `GET /screen/detail/:mediaId`

## 依存
- 認証ミドルウェア
- [ScreenDetailGetController](/doc/5_api/controller/screen/ScreenDetailGetController/readme.md)
- [GetMediaDetailService](/doc/4_application/media/query/GetMediaDetailService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `authResolver`
  - 認証トークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。
- `getMediaDetailService`
  - メディア詳細取得アプリケーションサービス。
  - `execute(input)` を持つ。

## ルーティングフロー
1. `認証ミドルウェア`
   - `req.context.authToken` を検証し、`req.context.userId` を設定する。
2. `ScreenDetailGetController`
   - `req.params.mediaId` を使って詳細を取得し、`screen/detail` を描画する。

## エラーハンドリング
- 認証失敗時は `401` を返す（AuthMiddleware）。
- 詳細取得失敗時はコントローラー側の例外ハンドリングに委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenDetailGet/testcase.medium.md)
