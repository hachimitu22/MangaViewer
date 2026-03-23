# ScreenViewerGetController

## 概要
- `GET /screen/viewer/:mediaId/:mediaPage` の画面描画責務を持つ controller。
- `req.params.mediaId` と `req.params.mediaPage` を `GetMediaContentWithNavigationService.Input` に変換し、戻り値の種別に応じて viewer 描画またはエラー画面遷移を決定する。
- `FoundResult` のときのみ `screen/viewer` を描画し、前後ページ導線とコンテンツ種別を含む描画モデルを生成する。

## 配置
- 実装: `src/controller/screen/ScreenViewerGetController.js`
- 対応 route: `GET /screen/viewer/:mediaId/:mediaPage`
- 描画テンプレート: `src/views/screen/viewer.ejs`

## 入力
- `req.params.mediaId`
  - 型: `string`
  - 用途: `GetMediaContentWithNavigationService.Input.mediaId`
- `req.params.mediaPage`
  - 型: `string`
  - controller 内で `Number.parseInt(..., 10)` して `contentPosition` に渡す。
- `res`
  - `status(code)` と `render(view, model)`、`redirect(status, url)` を持つこと。

## 依存
- [GetMediaContentWithNavigationService](/doc/4_application/media/query/GetMediaContentWithNavigationService/readme.md)
  - `execute(input)` を提供する。
  - 戻り値は `FoundResult` / `MediaNotFoundResult` / `ContentNotFoundResult` のいずれかを想定する。

## 処理フロー
1. `req.params.mediaPage` を 10 進数で整数変換する。
2. `new Input({ mediaId: req.params.mediaId, contentPosition: mediaPage })` を生成する。
3. `getMediaContentWithNavigationService.execute(input)` を await する。
4. `MediaNotFoundResult` または `ContentNotFoundResult` の場合は `res.redirect(301, '/screen/error')` を返す。
5. `FoundResult` 以外の戻り値は想定外として例外化し、catch 節で `res.redirect(301, '/screen/error')` を返す。
6. `FoundResult` の場合は viewer 描画モデルを組み立て、`res.status(200).render('screen/viewer', model)` を返す。

## 戻り値種別ごとの分岐
- `FoundResult`
  - 画面描画を実行する唯一の正常系。
- `MediaNotFoundResult`
  - メディア自体が存在しないため、`/screen/error` に `301` リダイレクトする。
- `ContentNotFoundResult`
  - 対象ページが存在しないため、`/screen/error` に `301` リダイレクトする。
- 上記以外
  - 想定外結果として例外化し、catch 節で `301` リダイレクトする。

## 描画モデル
- `pageTitle`
  - `ビューアー ${mediaId} - ${mediaPage}ページ`
- `mediaId`
  - `req.params.mediaId` をそのまま使用する。
- `mediaPage`
  - 整数変換後のページ番号。
- `content`
  - `id`: `result.contentId`
  - `type`: `contentId` の拡張子が `mp4|webm|ogg|mov|m4v` のとき `video`、それ以外は `image`
- `previousPage`
  - `result.previousContentId === null` のとき `null`
  - それ以外は `{ mediaId, mediaPage: mediaPage - 1, contentId, href }`
- `nextPage`
  - `result.nextContentId === null` のとき `null`
  - それ以外は `{ mediaId, mediaPage: mediaPage + 1, contentId, href }`

## not found / エラー時の振る舞い
- service が not found を結果オブジェクトで返した場合は controller が明示的に `301` リダイレクトする。
- `Input` 生成失敗、service 実行失敗、想定外戻り値などの例外は catch 節で一括して `301` リダイレクトする。
- 例外の詳細はレスポンスへ露出しない。

## テスト方針
- controller 単体の small テストでは以下を確認する。
  - 戻り値種別ごとの分岐
  - 描画モデル生成（前後ページ導線、content type 判定）
  - 例外時の `/screen/error` リダイレクト
- route path・認証ミドルウェア接続・実 HTTP 応答は router テストに委譲し、責務重複を避ける。

## 関連ドキュメント
- [controllerテストケース](/doc/5_api/controller/screen/ScreenViewerGetController/testcase.md)
