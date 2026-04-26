# router (GET /screen/favorite)

## 概要
- お気に入り一覧画面表示用のルーティング定義を担当する。
- 認証後にお気に入り一覧を取得し、`screen/favorite` を描画する。
- Node.js / Express の `router.get` に対して、`認証ミドルウェア` と非同期描画ハンドラーを設定する。

## 対象
- `GET /screen/favorite`

## 依存
- 認証ミドルウェア
- GetFavoriteSummariesService（お気に入り一覧取得サービス実装を参照）

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `authResolver`
  - 認証トークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。
- `getFavoriteSummariesService`
  - お気に入り一覧取得アプリケーションサービス。
  - `execute(input)` を持つ。

## ルーティングフロー
1. `認証ミドルウェア`
   - `req.context.authToken` を検証し、`req.context.userId` を設定する。
2. 非同期描画ハンドラー
   - `req.context.userId` を使ってお気に入り一覧を取得する。
   - `screen/favorite` を描画する。

## エラーハンドリング
- 認証失敗時は `401` を返す（AuthMiddleware）。
- 一覧取得失敗時は `next(error)` に委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenFavoriteGet/testcase.medium.md)
