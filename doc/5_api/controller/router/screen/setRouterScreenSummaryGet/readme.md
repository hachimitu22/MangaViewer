# router (GET /screen/summary)

## 概要
- 一覧・サマリー画面表示用のルーティング定義を担当する。
- 検索条件を正規化し、検索サービスの結果をページネーション情報とともに `screen/summary` へ描画する。
- Node.js / Express の `router.get` に対して、非同期描画ハンドラーを設定する。

## 対象
- `GET /screen/summary`

## 依存
- [SearchMediaService](/doc/4_application/media/query/SearchMediaService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `searchMediaService`
  - メディア検索アプリケーションサービス。
  - `execute(input)` を持つ。

## ルーティングフロー
1. 非同期描画ハンドラー
   - `summaryPage`、`title`、`tags`、`sort` を正規化する。
   - `SearchMediaService` を実行する。
   - 検索結果からページネーションを計算し、`screen/summary` を描画する。

## エラーハンドリング
- 検索処理失敗時は `next(error)` に委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenSummaryGet/testcase.medium.md)
