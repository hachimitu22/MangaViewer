# router (DELETE /api/media/:mediaId)

## 概要
- `DELETE /api/media/:mediaId` のルーティング定義を担当する。
- セッション認証後にメディア削除コントローラーへ処理を委譲する。
- Node.js / Express の `router.delete` に対して、`SessionAuthMiddleware` → `MediaDeleteController` の順でハンドラーを設定する。

## 対象
- `DELETE /api/media/:mediaId`

## 依存
- [SessionAuthMiddleware](/doc/5_api/controller/middleware/SessionAuthMiddleware/readme.md)
- [MediaDeleteController](/doc/5_api/controller/api/MediaDeleteController/readme.md)
- [DeleteMediaService](/doc/4_application/media/command/DeleteMediaService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `delete(path, ...handlers)` を持つ。
- `authResolver`
  - セッショントークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。
- `deleteMediaService`
  - メディア削除アプリケーションサービス。
  - `execute(command)` を持つ。

## ルーティングフロー
1. `SessionAuthMiddleware`
   - `req.session.session_token` を検証し、`req.context.userId` を設定する。
2. `MediaDeleteController`
   - `req.params.mediaId` を使って削除サービスを実行し、レスポンスを返す。

## エラーハンドリング
- 認証失敗時は `401` を返す（SessionAuthMiddleware）。
- 削除処理失敗時はコントローラー側の例外ハンドリングに委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/media/setRouterApiMediaDelete/testcase.medium.md)
