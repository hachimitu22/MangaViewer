# router (GET /screen/edit/:mediaId)

## 概要
- 編集画面表示用のルーティング定義を担当する。
- メディア詳細を取得し、編集画面に必要な初期表示データを組み立てて `screen/edit` を描画する。
- Node.js / Express の `router.get` に対して、非同期描画ハンドラーを設定する。

## 対象
- `GET /screen/edit/:mediaId`

## 依存
- [GetMediaDetailService](/doc/4_application/media/query/GetMediaDetailService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `getMediaDetailService`
  - メディア詳細取得アプリケーションサービス。
  - `execute(input)` を持つ。

## ルーティングフロー
1. 非同期描画ハンドラー
   - `req.params.mediaId` を使ってメディア詳細を取得する。
   - 既存コンテンツには `id` に加えて `/contents/...` の公開 `url` を付与する。
   - `pageTitle`、カテゴリ候補、タグ候補を組み立てて `screen/edit` を描画する。

## エラーハンドリング
- 詳細取得失敗時は `next(error)` に委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenEditGet/testcase.medium.md)
