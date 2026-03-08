# SessionAuthMiddleware

## 概要
- Node.js / Express 環境で動作する認証ミドルウェア。
- セッション管理は `express-session` を使用し、認証判定は `req.session.session_token` を参照して行う。
- `req.session.session_token` にはセッショントークン文字列が格納されることを前提とする。
- 認証に失敗した場合は後続処理を中断する。
- 認証成功時は後続の Controller 要件に応じて認証コンテキストをリクエストへ設定する（`userId` が必要な Controller では `request.context.userId` に文字列の `userId` を設定する）。

## 入出力契約
- 入力
  - `express-session` によって `req.session` が生成されていること。
  - `req.session.session_token` を認証対象として参照する。
  - `req.session` が未生成、`session_token` が未設定、`session_token` が `string` 以外、空文字、期限切れ、形式不正、署名不一致、セッションストア未存在、明示失効の場合は認証失敗とする。
- 出力
  - `request.context` が未作成の場合は、ミドルウェア内でオブジェクトを初期化してから利用する。
  - 認証成功時に `request.context.userId` を設定する。
  - `request.context.userId` は空文字ではない `string` とする。
  - セッションから `userId` を解決できない場合は認証失敗として扱い、`request.context.userId` を設定しない。
  - 認証失敗時は `request.context.userId` を設定しない。

## 振る舞い
- `req.session.session_token` が有効であり、かつ `userId` を解決できる場合は、Controller 要件に応じた認証コンテキスト（必要に応じて `request.context.userId`（string））を設定し、次のミドルウェア / Controller へ処理を委譲する。
- `req.session.session_token` が無効、または `userId` を解決できない場合は `401` を返し、後続の Controller は実行しない。

## 認証失敗時レスポンス
- ステータスコード: `401`
- Content-Type: `application/json`
- レスポンスボディ: `{ "message": "認証に失敗しました" }`
- レスポンス仕様は [OpenAPI UnauthorizedApi](/doc/5_api/openapi/openapi.yaml) に準拠する。
- 追加ヘッダは特別に定義せず、必要になった場合は OpenAPI へ追記してから適用する。
