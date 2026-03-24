# router (POST /api/logout)

## 概要
- `POST /api/logout` のルーティング定義を担当する。
- セッション認証後にログアウトコントローラーへ処理を委譲する。
- Node.js / Express の `router.post` に対して、`SessionAuthMiddleware` → `LogoutPostController` の順でハンドラーを設定する。

## 対象
- `POST /api/logout`

## 依存
- [SessionAuthMiddleware](/doc/5_api/controller/middleware/SessionAuthMiddleware/readme.md)
- [LogoutPostController](/doc/5_api/controller/api/LogoutPostController/readme.md)
- [LogoutService](/doc/4_application/user/command/LogoutService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `post(path, ...handlers)` を持つ。
- `authResolver`
  - セッショントークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。
- `logoutService`
  - ログアウトアプリケーションサービス。
  - `execute(command)` を持つ。

## ルーティングフロー
1. `SessionAuthMiddleware`
   - `req.session.session_token` を検証し、`req.context.userId` を設定する。
2. `LogoutPostController`
   - ログアウト処理を実行し、レスポンスを返す。

## エラーハンドリング
- 認証失敗時は `401` を返す（SessionAuthMiddleware）。
- ログアウト失敗時は `LogoutPostController` のレスポンス仕様に従う。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/user/setRouterApiLogout/testcase.medium.md)
