# createApp テストケース整理

## medium: ルーティング統合・未定義ルート・開発セッション連携

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
  - `POST /api/login`（既存）と `GET /api/not-found-handler-target`（未定義）を実行する。
- 期待結果
  - 既存ルートは個別レスポンス（認証失敗時 `{ code: 1 }`）を返す。
  - 未定義ルートは `404` JSON `{ message: 'Not Found' }` を返す。

### M-03: 認証要否に関係なく未定義パスは共通 404 を返す
- 前提
  - `createApp` を初期化し `await app.locals.ready` を完了する。
- 操作
  - `/screen/login/not-found` `/screen/entry/not-found` `/api/login/not-found` `/api/media/not-found` を実行する。
- 期待結果
  - すべて `404` JSON `{ message: 'Not Found' }` を返す。

### M-04: 固定セッション設定が無効な場合、`createDependencies` は事前登録しない
- 前提
  - `createDependencies` に `devSessionToken: ''` を含めて依存を生成する。
- 操作
  - `await dependencies.ready` 後、`dependencies.authResolver.execute('dev-token')` を実行する。
- 期待結果
  - 固定セッションが見つからず `undefined` を返す。

### M-05: 固定セッション設定が無効な場合、`setupMiddleware` は `req.session.session_token` を補完しない
- 前提
  - `express()` に `setupMiddleware` を適用し、`devSessionToken: ''` と `devSessionPaths: ['/screen/entry']` を指定する。
- 操作
  - `GET /screen/entry` を実行し、レスポンスで `req.session.session_token` を観測する。
- 期待結果
  - `sessionToken` は `null` のまま（自動補完なし）。

### M-06: server 初期化相当で固定セッション無効時は有効化ログを出力しない
- 前提
  - `process.env.DEV_SESSION_TOKEN = ''` など固定セッション無効の環境変数を設定する。
  - `src/app` をモックして `server` 起動の最小経路を実行する。
- 操作
  - `require('../../../src/server')` を実行し、`console.log` / `console.error` / `process.exit` を監視する。
- 期待結果
  - `listen` は呼び出される。
  - 「開発用固定セッションを有効化しました」を含むログは出力されない。
  - `console.error` と `process.exit` は呼び出されない。

## 参照
- [createApp 設計書](/doc/4_application/app/createApp/readme.md)
