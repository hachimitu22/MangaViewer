# router (GET /screen/login)

## 概要
- ログイン画面表示用のルーティング定義を担当する。
- `screen/login` を描画するための固定表示データを返す。
- Node.js / Express の `router.get` に対して、描画ハンドラーを設定する。

## 対象
- `GET /screen/login`

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。

## ルーティングフロー
1. 描画ハンドラー
   - ログイン画面のフォーム設定を組み立てる。
   - `screen/login` を描画する。

## エラーハンドリング
- 本 router 自身では例外処理を持たず、描画失敗時は Express の既定挙動に委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenLoginGet/testcase.md)
