# router (GET /screen/entry)

## 概要
- 登録画面表示用のルーティング定義を担当する。
- 認証後に初期表示データを組み立てて `screen/entry` を描画する。
- Node.js / Express の `router.get` に対して、`認証ミドルウェア` と描画ハンドラーを設定する。

## 対象
- `GET /screen/entry`

## 依存
- 認証ミドルウェア

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `authResolver`
  - 認証トークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。

## ルーティングフロー
1. `認証ミドルウェア`
   - `req.context.authToken` を検証し、`req.context.userId` を設定する。
2. 描画ハンドラー
   - 登録画面用のカテゴリ候補とタグ候補を組み立てる。
   - `screen/entry` を描画する。

## エラーハンドリング
- 認証失敗時は `401` を返す（AuthMiddleware）。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenEntryGet/testcase.medium.md)
