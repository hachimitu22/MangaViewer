# router (PATCH /api/media/:mediaId)

## 概要
- `PATCH /api/media/:mediaId` のルーティング定義を担当する。
- セッション認証・コンテンツ保存・メディア更新の各責務を、ミドルウェアとコントローラーへ順に委譲する。
- Node.js / Express の `router.patch` に対して、`SessionAuthMiddleware` → `ContentSaveMiddleware` → `MediaPatchController` の順でハンドラーを設定する。

## 対象
- `PATCH /api/media/:mediaId`

## 依存
- [SessionAuthMiddleware](/doc/5_api/controller/middleware/SessionAuthMiddleware/readme.md)
- [ContentSaveMiddleware](/doc/5_api/controller/middleware/ContentSaveMiddleware/readme.md)
- [MediaPatchController](/doc/5_api/controller/api/MediaPatchController/readme.md)
- [UpdateMediaService](/doc/4_application/media/command/UpdateMediaService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `patch(path, ...handlers)` を持つ。
- `authResolver`
  - セッショントークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。
- `saveAdapter`
  - multer の `DiskStorage` を使って `req, res, cb` 形式で保存処理を実行するアダプタ。
  - `execute(req, res, cb)` を持つ。
- `updateMediaService`
  - メディア更新アプリケーションサービス。
  - `execute(command)` を持つ。

## ルーティングフロー
1. `SessionAuthMiddleware`
   - `req.session.session_token` から `req.context.userId` を設定する。
2. `ContentSaveMiddleware`
   - `saveAdapter.execute(req, res, cb)` にアップロード処理を委譲し、`req.context.contentIds` を検証する。
3. `MediaPatchController`
   - `mediaId` と更新入力を使って `updateMediaService` を実行し、レスポンスを返す。

## エラーハンドリング
- 認証失敗時は `401` を返す（SessionAuthMiddleware）。
- 入力不正・保存失敗・更新失敗時はミドルウェア／コントローラー側の例外ハンドリングに委譲する。

## 関連ドキュメント
- [routerテストケース](/doc/5_api/controller/router/media/setRouterApiMediaPatch/testcase.md)
