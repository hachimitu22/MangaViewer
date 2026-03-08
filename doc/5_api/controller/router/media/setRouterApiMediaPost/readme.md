# router (POST /api/media)

## 概要
- `POST /api/media` のルーティング定義を担当する。
- 認証・コンテンツ保存・メディア登録の各責務を、ミドルウェアとコントローラーへ順に委譲する。
- Node.js / Express の `router.post` に対して、`SessionAuthMiddleware` → `ContentSaveMiddleware` → `MediaPostController` の順でハンドラーを設定する。

## 対象
- `POST /api/media`

## 依存
- [SessionAuthMiddleware](/doc/5_api/controller/middleware/SessionAuthMiddleware/readme.md)
- [ContentSaveMiddleware](/doc/5_api/controller/middleware/ContentSaveMiddleware/readme.md)
- [MediaPostController](/doc/5_api/controller/api/MediaPostController/readme.md)
- [RegisterMediaService](/doc/4_application/media/command/RegisterMediaService/readme.md)

## 依存注入
- `router`
  - Express Router。
  - `post(path, ...handlers)` を持つ。
- `authResolver`
  - セッショントークンから `userId` を解決するアダプタ。
  - `execute(token)` を持つ。
- `saveResolver`
  - `contents` を保存し、`contentIds` を返すアダプタ。
  - `execute(contents)` を持つ。
- `mediaIdValueGenerator`
  - メディアID生成。
  - `generate()` を持つ。
- `mediaRepository`
  - メディア永続化。
  - `save(media)` を持つ。

## ルーティングフロー
1. `SessionAuthMiddleware`
   - `req.session.session_token` から `request.context.userId` を設定する。
2. `ContentSaveMiddleware`
   - `req.body.contents` を保存し、`request.context.contentIds` を設定する。
3. `MediaPostController`
   - `title` / `tags` / `contentIds` を使って `RegisterMediaService` を実行し、レスポンスを返す。

## エラーハンドリング
- 認証失敗時は `401` を返す（SessionAuthMiddleware）。
- 入力不正・保存失敗・登録失敗時は `200` + `code: 1` を返す（ContentSaveMiddleware / MediaPostController）。

## 関連ドキュメント
- [OpenAPI /api/media](/doc/5_api/openapi/paths/api/media.yaml)
- [routerテストケース](/doc/5_api/controller/router/media/setRouterApiMediaPost/testcase.md)
