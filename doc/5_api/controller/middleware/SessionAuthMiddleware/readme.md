# SessionAuthMiddleware

## 概要
- Cookieの `sessionId` を検証するミドルウェア。
- Cookie名は OpenAPI `cookieAuth` と同じ `sessionId` 固定とする。
- 認証に失敗した場合は後続処理を中断する。
- 認証成功時は、後続のController要件に応じて認証コンテキストをリクエストへ設定する（`userId` が必要なControllerでは `request.context.userId` に文字列の `userId` を設定する）。

## 入出力契約
- 入力
  - 参照対象のCookieキーは `sessionId`。
  - `sessionId` が未指定・無効・期限切れの場合は認証失敗とする。
- 出力
  - 認証成功時に `request.context.userId` を設定する。
  - `request.context.userId` は空文字ではない `string` とする。
  - 認証失敗時は `request.context.userId` を設定しない。

## 振る舞い
- `sessionId` が有効な場合は、Controller要件に応じた認証コンテキスト（必要に応じて `request.context.userId`（string））を設定し、次のミドルウェア / Controllerへ処理を委譲する。
- `sessionId` が未指定・無効・期限切れの場合は `401` を返し、後続のControllerは実行しない。

## 認証失敗時レスポンス
- ステータスコード: `401`
- Content-Type: `application/json`
- レスポンスボディ: `{ "message": "認証に失敗しました" }`
- レスポンス仕様は [OpenAPI UnauthorizedApi](/doc/5_api/openapi/openapi.yaml) に準拠する。
