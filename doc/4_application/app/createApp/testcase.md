# createApp テストケース整理

## 目的
- `createApp` の既存テストを **small（初期化契約）** と **medium（ルーティング統合・未定義ルート・開発セッション連携）** に分類し、観点別に確認手順を明確化する。
- 既存テストの意図を維持したまま、追加・改修時に回帰観点を追跡しやすくする。

## 対象テスト
- small: `__tests__/small/app/createApp.test.js`
- medium: `__tests__/medium/app/setupRoutes.notFound.test.js`
- medium: `__tests__/medium/app/developmentSession.integration.test.js`

## small: 初期化契約（`app.locals.ready` / `app.locals.close` を含む）

### S-01: `createApp` が初期化済みアプリとして主要ルートを公開できる
- 前提
  - 一時的な `databaseStoragePath` / `contentRootDirectory` を用意する。
  - `createApp({ databaseStoragePath, contentRootDirectory })` を実行する。
- 操作
  - `await app.locals.ready` で初期化完了を待機する。
  - `GET /screen/error` を実行する。
  - 未認証状態で `POST /api/media` を実行する。
- 期待結果
  - `/screen/error` は `200` と HTML（エラー画面）を返す。
  - `/api/media` は `401` と `{ message: '認証に失敗しました' }` を返す。

### S-02: 開発用固定セッション設定が無効な場合、対象パスでも自動補完されない
- 前提
  - `devSessionToken: ''` を含む `createApp` を生成する。
  - `devSessionPaths` に `/screen/entry` と `/api/media` を含める。
- 操作
  - `await app.locals.ready` 実行後、`GET /screen/entry` と `POST /api/media` を実行する。
- 期待結果
  - いずれも `401` と `{ message: '認証に失敗しました' }` を返す。

### S-03: 開発用固定セッション設定が有効な場合、対象パスで認証が補完される
- 前提
  - `devSessionToken` / `devSessionUserId` / `devSessionTtlMs` を設定した `createApp` を生成する。
  - `devSessionPaths` に `/screen/entry` `/screen/search` `/screen/summary` `/api/media` を含める。
- 操作
  - `await app.locals.ready` 実行後、各 screen ルートへ `GET` し、`/api/media` へ `POST` する。
- 期待結果
  - `/screen/entry` は `200`（メディア登録画面）を返す。
  - `/screen/search` は `200`（メディア検索画面）を返す。
  - `/screen/summary` は `200`（メディア一覧画面）を返す。
  - `/screen/login` は `200`（ログイン画面）を返す。
  - `/api/media` は `200` と `{ code: 0, mediaId }` を返す。

### S-04: `app.locals.close` によりテスト後の終了処理を実行できる
- 前提
  - `createApp` で生成した `app` を利用し、`await app.locals.ready` まで完了している。
- 操作
  - テスト終了時に `if (app?.locals?.close) await app.locals.close()` を実行する。
- 期待結果
  - クリーンアップ時に依存オブジェクトの終了処理が実行され、以降のテストへ状態を持ち越さない。

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
