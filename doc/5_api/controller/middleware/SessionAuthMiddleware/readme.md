# SessionAuthMiddleware

## 概要
- Cookie の `sessionId` を検証するミドルウェア。
- Cookie 名は OpenAPI `cookieAuth` と同じ `sessionId` 固定とする。
- 認証に失敗した場合は後続処理を中断する。
- 認証成功時は後続の Controller 要件に応じて認証コンテキストをリクエストへ設定する（`userId` が必要な Controller では `request.context.userId` に文字列の `userId` を設定する）。

## 入出力契約
- 入力
  - 参照対象の Cookie キーは `sessionId`。
  - `sessionId` が未指定・期限切れ・形式不正・署名不一致・セッションストア未存在・明示失効の場合は認証失敗とする。
- 出力
  - `request.context` が未作成の場合は、ミドルウェア内でオブジェクトを初期化してから利用する。
  - 認証成功時に `request.context.userId` を設定する。
  - `request.context.userId` は空文字ではない `string` とする。
  - セッションから `userId` を解決できない場合は認証失敗として扱い、`request.context.userId` を設定しない。
  - 認証失敗時は `request.context.userId` を設定しない。

## 振る舞い
- `sessionId` が有効であり、かつ `userId` を解決できる場合は、Controller 要件に応じた認証コンテキスト（必要に応じて `request.context.userId`（string））を設定し、次のミドルウェア / Controller へ処理を委譲する。
- `sessionId` が未指定・無効・期限切れ、または `userId` を解決できない場合は `401` を返し、後続の Controller は実行しない。

## 認証失敗時レスポンス
- ステータスコード: `401`
- Content-Type: `application/json`
- レスポンスボディ: `{ "message": "認証に失敗しました" }`
- レスポンス仕様は [OpenAPI UnauthorizedApi](/doc/5_api/openapi/openapi.yaml) に準拠する。
- 追加ヘッダは特別に定義せず、必要になった場合は OpenAPI へ追記してから適用する。

## ログ / 責務境界
- 監査・運用ログには `sessionId` の生値を出力しない（必要な場合はマスクした識別子のみを利用する）。
- 認証失敗時は、詳細な機密情報ではなく失敗理由の種別（例: `expired` / `invalid-signature`）を記録する。
- Cookie 属性（`Secure` / `HttpOnly` / `SameSite`）はセッション発行側（ログイン処理）の責務とし、本ミドルウェアでは検証対象 Cookie 名と検証結果の扱いを責務範囲とする。
