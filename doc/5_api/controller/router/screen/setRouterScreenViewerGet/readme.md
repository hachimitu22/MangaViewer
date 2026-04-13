# router (GET /screen/viewer/:mediaId/:mediaPage)

## 概要
- ビューアー画面表示用のルーティング定義を担当する。
- セッション認証後にビューアー画面コントローラーを呼び出し、`screen/viewer` を描画する。
- Node.js / Express の `router.get` に対して、`SessionAuthMiddleware` → `ScreenViewerGetController` の順でハンドラーを設定する。

## 対象
- `GET /screen/viewer/:mediaId/:mediaPage`

## 認証
- 必須。
- `SessionAuthMiddleware` により `req.session.session_token` を検証し、`req.context.userId` を設定する。

## 依存
- [SessionAuthMiddleware](/doc/5_api/controller/middleware/SessionAuthMiddleware/readme.md)
- [ScreenViewerGetController](/doc/5_api/controller/screen/ScreenViewerGetController/readme.md)
- [GetMediaContentWithNavigationService](/doc/4_application/media/query/GetMediaContentWithNavigationService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `get(path, ...handlers)` を持つ。
- `authResolver`
  - セッショントークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。
- `getMediaContentWithNavigationService`
  - 対象ページと前後ページのコンテンツを取得するアプリケーションサービス。
  - `execute(input)` を持つ。

## ルーティングフロー
1. `SessionAuthMiddleware`
   - `req.session.session_token` を検証し、`req.context.userId` を設定する。
2. `ScreenViewerGetController`
   - `req.params.mediaId` / `req.params.mediaPage` を使って `GetMediaContentWithNavigationService` を実行する。
   - 正常時は `screen/viewer` を描画し、異常時は `/screen/error` へリダイレクトする。

## レスポンス / 描画先
- 正常系
  - HTTP ステータス `200` を返す。
  - `screen/viewer` を描画する。
  - 描画データとして以下を渡す。
    - `pageTitle`: `ビューアー {mediaId} - {mediaPage}ページ`
    - `mediaId`
    - `mediaPage`
    - `content`
    - `previousPage`
    - `nextPage`
- 異常系
  - メディア未存在・ページ未存在・予期しない例外時は `/screen/error` へ `301` リダイレクトする。

## エラーハンドリング
- 認証失敗時は `401` を返す（SessionAuthMiddleware）。
- ビューアー表示処理中のエラー制御は `ScreenViewerGetController` 側に委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/screen/setRouterScreenViewerGet/testcase.medium.md)
