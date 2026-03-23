# router (GET /screen/search)

## 概要
- 検索画面表示用のルーティング定義を担当する。
- セッション認証後に検索条件の初期表示データを組み立てて `screen/search` を描画する。
- Node.js / Express の `router.get` に対して、`SessionAuthMiddleware` と描画ハンドラーを設定する。

## 対象
- `GET /screen/search`

## 依存
- [SessionAuthMiddleware](/doc/5_api/controller/middleware/SessionAuthMiddleware/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `authResolver`
  - セッショントークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。

## ルーティングフロー
1. `SessionAuthMiddleware`
   - `req.session.session_token` を検証し、`req.context.userId` を設定する。
2. 描画ハンドラー
   - 検索条件、タグ候補、ソート候補を組み立てる。
   - `screen/search` を描画する。

## エラーハンドリング
- 認証失敗時は `401` を返す（SessionAuthMiddleware）。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenSearchGet/testcase.md)
