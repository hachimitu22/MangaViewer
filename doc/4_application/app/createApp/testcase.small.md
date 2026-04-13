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
