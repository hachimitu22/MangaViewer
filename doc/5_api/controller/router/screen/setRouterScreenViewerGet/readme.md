# router (GET /screen/viewer/:mediaId/:mediaPage)

## 概要
- ビューアー画面表示用のルーティング定義を担当する。
- ビューアー画面コントローラーを呼び出し、`screen/viewer` を描画する。
- Node.js / Express の `router.get` に対して、`ScreenViewerGetController` を設定する。

## 対象
- `GET /screen/viewer/:mediaId/:mediaPage`

## 依存
- [ScreenViewerGetController](/doc/5_api/controller/screen/ScreenViewerGetController/readme.md)
- [GetMediaContentWithNavigationService](/doc/4_application/media/query/GetMediaContentWithNavigationService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `getMediaContentWithNavigationService`
  - 対象ページと前後ページのコンテンツを取得するアプリケーションサービス。
  - `execute(input)` を持つ。

## ルーティングフロー
1. `ScreenViewerGetController`
   - `req.params.mediaId` / `req.params.mediaPage` を使って `GetMediaContentWithNavigationService` を実行する。
   - 正常時は `screen/viewer` を描画し、異常時は `/screen/error` へリダイレクトする。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenViewerGet/testcase.medium.md)
