# router (GET /screen/queue)

## 概要
- あとで見る一覧画面表示用のルーティング定義を担当する。
- セッション認証後にキュー一覧取得サービスを呼び出し、`screen/queue` を描画する。
- Node.js / Express の `router.get` に対して、`SessionAuthMiddleware` と非同期描画ハンドラーを設定する。

## 対象
- `GET /screen/queue`

## 認証
- 必須。
- `SessionAuthMiddleware` により `req.session.session_token` を検証し、`req.context.userId` を設定する。

## 依存
- [SessionAuthMiddleware](/doc/5_api/controller/middleware/SessionAuthMiddleware/readme.md)
- [GetQueueService](/doc/4_application/user/query/GetQueueService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `authResolver`
  - セッショントークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。
- `getQueueService`
  - あとで見る一覧取得アプリケーションサービス。
  - `execute(input)` を持つ。

## ルーティングフロー
1. `SessionAuthMiddleware`
   - `req.session.session_token` を検証し、`req.context.userId` を設定する。
2. 非同期描画ハンドラー
   - `req.context.userId` を使って `GetQueueService` を実行する。
   - 取得した `mediaOverviews` を `screen/queue` に渡して描画する。

## レスポンス / 描画先
- 正常系
  - HTTP ステータス `200` を返す。
  - `screen/queue` を描画する。
  - 描画データとして以下を渡す。
    - `pageTitle`: `あとで見る一覧`
    - `mediaOverviews`: サービスが返した一覧

## エラーハンドリング
- 認証失敗時は `401` を返す（SessionAuthMiddleware）。
- 一覧取得失敗時は `next(error)` に委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenQueueGet/testcase.md)
