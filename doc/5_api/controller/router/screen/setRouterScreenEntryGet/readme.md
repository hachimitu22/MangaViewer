# router (GET /screen/entry)

## 概要
- 登録画面表示用のルーティング定義を担当する。
- 初期表示データを組み立てて `screen/entry` を描画する。
- Node.js / Express の `router.get` に対して、描画ハンドラーを設定する。

## 対象
- `GET /screen/entry`

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。

## ルーティングフロー
1. 描画ハンドラー
   - 登録画面用のカテゴリ候補とタグ候補を組み立てる。
   - `screen/entry` を描画する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenEntryGet/testcase.medium.md)
