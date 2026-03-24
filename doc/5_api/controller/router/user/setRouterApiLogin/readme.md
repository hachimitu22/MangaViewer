# router (POST /api/login)

## 概要
- `POST /api/login` のルーティング定義を担当する。
- ログイン要求を `LoginPostController` に委譲する。
- Node.js / Express の `router.post` に対して、ログインコントローラーを設定する。

## 対象
- `POST /api/login`

## 依存
- [LoginPostController](/doc/5_api/controller/api/LoginPostController/readme.md)
- [LoginService](/doc/4_application/user/command/LoginService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `post(path, ...handlers)` を持つ。
- `loginService`
  - ログインアプリケーションサービス。
  - `execute(command)` を持つ。

## ルーティングフロー
1. `LoginPostController`
   - `req.body.username` / `req.body.password` を使ってログイン処理を実行する。
   - 成功時はセッションと Cookie を更新し、レスポンスを返す。

## エラーハンドリング
- 入力不正や認証失敗時は `LoginPostController` のレスポンス仕様に従う。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/user/setRouterApiLogin/testcase.medium.md)
