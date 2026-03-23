# router (favorite / queue API)

## 概要
- お気に入り・キュー操作 API のルーティング定義を担当する。
- 各ルートでセッション認証後に、対応するアプリケーションサービスへ処理を委譲する。
- `PUT /api/favorite/:mediaId`、`DELETE /api/favorite/:mediaId`、`PUT /api/queue/:mediaId`、`POST /api/queue/:mediaId`、`DELETE /api/queue/:mediaId` を登録する。

## 対象
- `PUT /api/favorite/:mediaId`
- `DELETE /api/favorite/:mediaId`
- `PUT /api/queue/:mediaId`
- `POST /api/queue/:mediaId`
- `DELETE /api/queue/:mediaId`

## 依存
- [SessionAuthMiddleware](/doc/5_api/controller/middleware/SessionAuthMiddleware/readme.md)
- [AddFavoriteService](/doc/4_application/user/command/AddFavoriteService/readme.md)
- [RemoveFavoriteService](/doc/4_application/user/command/RemoveFavoriteService/readme.md)
- [AddQueueService](/doc/4_application/user/command/AddQueueService/readme.md)
- [RemoveQueueService](/doc/4_application/user/command/RemoveQueueService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `put(path, ...handlers)` / `post(path, ...handlers)` / `delete(path, ...handlers)` を持つ。
- `authResolver`
  - セッショントークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。
- `addFavoriteService`
  - お気に入り追加アプリケーションサービス。
  - `execute(query)` を持つ。
- `removeFavoriteService`
  - お気に入り解除アプリケーションサービス。
  - `execute(query)` を持つ。
- `addQueueService`
  - キュー追加アプリケーションサービス。
  - `execute(query)` を持つ。
- `removeQueueService`
  - キュー解除アプリケーションサービス。
  - `execute(query)` を持つ。

## ルーティングフロー
1. `SessionAuthMiddleware`
   - `req.session.session_token` から `req.context.userId` を設定する。
2. ルート別ハンドラー
   - お気に入り追加/解除では `mediaId` と `userId` から Query を生成してサービスを呼ぶ。
   - キュー追加/解除では `PUT` / `POST` / `DELETE` に応じて対応サービスを呼ぶ。
   - いずれも成功時は `200` + `code: 0` を返す。

## エラーハンドリング
- 認証失敗時は `401` を返す（SessionAuthMiddleware）。
- サービス実行中の例外は `next(error)` に委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/user/setRouterApiFavoriteAndQueue/testcase.md)
