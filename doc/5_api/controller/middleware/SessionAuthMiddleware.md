# SessionAuthMiddleware

## 概要
- Cookieの `sessionId` を検証するミドルウェア。
- 認証に失敗した場合は後続処理を中断する。
- 認証成功時は、後続のController要件に応じて認証コンテキストをリクエストへ設定する（`userId` が必要なControllerでは文字列の `userId` を設定する）。

## 振る舞い
- `sessionId` が有効な場合は、Controller要件に応じた認証コンテキスト（必要に応じて `userId`（string））を設定し、次のミドルウェア / Controllerへ処理を委譲する。
- `sessionId` が未指定・無効・期限切れの場合は `401` を返し、後続のControllerは実行しない。
