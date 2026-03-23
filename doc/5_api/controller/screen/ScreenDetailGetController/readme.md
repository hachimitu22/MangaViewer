# ScreenDetailGetController

## 概要
- `GET /screen/detail/:mediaId` の画面描画責務を持つ controller。
- `req.params.mediaId` を `GetMediaDetailService` の `Input` に変換して実行し、取得した `mediaDetail` を `screen/detail` テンプレートへ渡す。
- not found を含む service 実行失敗時は詳細画面固有の分岐を持たず、`/screen/error` へ `301` リダイレクトする。

## 配置
- 実装: `src/controller/screen/ScreenDetailGetController.js`
- 対応 route: `GET /screen/detail/:mediaId`
- 描画テンプレート: `src/views/screen/detail.ejs`

## 入力
- `req.params.mediaId`
  - 型: `string`
  - 用途: `GetMediaDetailService.Input.mediaId`
- `res`
  - `status(code)` と `render(view, model)`、`redirect(status, url)` を持つこと。

## 依存
- [GetMediaDetailService](/doc/4_application/media/query/GetMediaDetailService/readme.md)
  - `execute(input)` を提供する。
  - controller は `new Input({ mediaId })` を生成して渡す。

## 処理フロー
1. `req.params.mediaId` から `GetMediaDetailService.Input` を生成する。
2. `getMediaDetailService.execute(input)` を await する。
3. 成功時は `res.status(200).render('screen/detail', model)` を返す。
4. service が例外を送出した場合は `res.redirect(301, '/screen/error')` を返す。

## 描画モデル
- `pageTitle`
  - `${result.mediaDetail.title} の詳細`
- `mediaDetail`
  - service から受け取った `result.mediaDetail` をそのまま引き渡す。

## not found / エラー時の振る舞い
- service 側で not found を例外として通知した場合を含め、controller は例外を一律で捕捉する。
- 捕捉した例外の種別やメッセージはレスポンスへ反映せず、`/screen/error` へ `301` リダイレクトする。

## テスト方針
- controller 単体の small テストでは以下に絞る。
  - `mediaId` の入力変換
  - 成功時の描画モデル生成
  - 失敗時の `/screen/error` へのリダイレクト
- 認証や route 登録順序、Express 統合は router テストに委譲する。

## 関連ドキュメント
- [controllerテストケース](/doc/5_api/controller/screen/ScreenDetailGetController/testcase.md)
- [router設計書](/doc/5_api/controller/router/screen/setRouterScreenDetailGet/readme.md)
