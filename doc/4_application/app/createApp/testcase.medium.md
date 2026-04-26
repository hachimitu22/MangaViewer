# createApp テストケース整理

## medium: ルーティング統合・未定義ルート

### M-01: 既存 screen ルートは個別レスポンス、未定義 screen ルートは共通 404
- 前提
  - `createApp` を初期化し `await app.locals.ready` を完了する。
- 操作
  - `GET /screen/error` と `GET /screen/not-found-handler-target` を実行する。
- 期待結果
  - 既存ルート `/screen/error` は `200` HTML を返す。
  - 未定義ルートは `404` JSON `{ message: 'Not Found' }` を返す。

### M-02: 既存 api ルートは個別レスポンス、未定義 api ルートは共通 404
- 前提
  - `createApp` を初期化し `await app.locals.ready` を完了する。
- 操作
  - `POST /api/media`（既存）と `GET /api/not-found-handler-target`（未定義）を実行する。
- 期待結果
  - 既存ルートは個別レスポンス（未認証時 `{ message: '認証に失敗しました' }`）を返す。
  - 未定義ルートは `404` JSON `{ message: 'Not Found' }` を返す。

### M-03: 認証要否に関係なく未定義パスは共通 404 を返す
- 前提
  - `createApp` を初期化し `await app.locals.ready` を完了する。
- 操作
  - `/screen/error/not-found` `/screen/entry/not-found` `/api/media/not-found` を実行する。
- 期待結果
  - すべて `404` JSON `{ message: 'Not Found' }` を返す。

## 参照
- [createApp 設計書](/doc/4_application/app/createApp/readme.md)
