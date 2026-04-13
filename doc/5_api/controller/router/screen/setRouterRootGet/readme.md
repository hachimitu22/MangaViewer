# router (GET /)

## 概要
- ルートパス `/` へのアクセス時に、セッション状態に応じた画面遷移を行うルーティング定義を担当する。
- `SessionAuthMiddleware` は使わず、`authResolver` を直接利用してリダイレクト先を決定する。
- 画面遷移要件に合わせて、未認証時はログイン画面へ、認証済み時は一覧画面へ遷移させる。

## 対象
- `GET /`

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `authResolver`
  - セッショントークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。

## ルーティングフロー
1. `req.session?.session_token` を取得する。
2. トークン未設定時は `/screen/login` へリダイレクトする。
3. `authResolver.execute(token)` で `userId` を解決する。
4. `userId` が解決できない、または例外発生時は `/screen/login` へリダイレクトする。
5. `userId` が解決できた場合は `/screen/summary` へリダイレクトする。

## エラーハンドリング
- `authResolver.execute` が例外を投げた場合は認証失敗として扱い、`/screen/login` へリダイレクトする。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterRootGet/testcase.medium.md)
- [setupRoutes 設計書](/doc/5_api/controller/router/setupRoutes/readme.md)
