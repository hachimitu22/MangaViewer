# router (GET /screen/summary)

## 概要
- 一覧・サマリー画面表示用のルーティング定義を担当する。
- セッション認証後に検索条件を正規化し、検索サービスの結果をページネーション情報とともに `screen/summary` へ描画する。
- Node.js / Express の `router.get` に対して、`SessionAuthMiddleware` と非同期描画ハンドラーを設定する。

## 対象
- `GET /screen/summary`

## 依存
- [SessionAuthMiddleware](/doc/5_api/controller/middleware/SessionAuthMiddleware/readme.md)
- [SearchMediaService](/doc/4_application/media/query/SearchMediaService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `authResolver`
  - セッショントークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。
- `searchMediaService`
  - メディア検索アプリケーションサービス。
  - `execute(input)` を持つ。

## ルーティングフロー
1. `SessionAuthMiddleware`
   - `req.session.session_token` を検証し、`req.context.userId` を設定する。
2. 非同期描画ハンドラー
   - `summaryPage`、`title`、`tags`、`sort` を正規化する。
   - `SearchMediaService` を実行する。
   - 検索結果からページネーションを計算し、`screen/summary` を描画する。

## エラーハンドリング
- 認証失敗時は `401` を返す（SessionAuthMiddleware）。
- 検索処理失敗時は `next(error)` に委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenSummaryGet/testcase.md)
