# router (GET /screen/search)

## 概要
- 検索画面表示用のルーティング定義を担当する。
- 検索条件の初期表示データを組み立てて `screen/search` を描画する。
- Node.js / Express の `router.get` に対して、描画ハンドラーを設定する。

## 対象
- `GET /screen/search`

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。

## ルーティングフロー
1. 描画ハンドラー
   - 検索条件、タグ候補、ソート候補を組み立てる。
   - `screen/search` を描画する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenSearchGet/testcase.medium.md)
