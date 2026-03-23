# server.js 起動設計書

## 概要
- `src/server.js` は、プロセス環境変数から起動設定 `env` を生成し、`createApp(env)` を経由して HTTP サーバーを起動するエントリーポイントである。
- 起動前に `app.locals.ready` を待機し、初期化失敗時は `listen` せずに終了する。
- 開発用固定セッションが有効な場合は、起動ログへ有効化情報を出力する。

## 対象実装
- 実装: `src/server.js`

## 入力となる環境変数

| 環境変数 | `env` 項目 | 既定値 / 変換 | 用途 |
| --- | --- | --- | --- |
| `PORT` | `port` | `parseInt(..., 10) || 3000` | HTTP listen ポート |
| `DATABASE_STORAGE_PATH` | `databaseStoragePath` | `var/data/mangaviewer.sqlite` | SQLite 保存先 |
| `CONTENT_ROOT_DIRECTORY` | `contentRootDirectory` | `var/contents` | コンテンツ保存先 |
| `DEV_SESSION_TOKEN` | `devSessionToken` | 空文字 | 開発用固定セッショントークン |
| `DEV_SESSION_USER_ID` | `devSessionUserId` | 空文字 | 開発用固定セッションの利用者ID |
| `DEV_SESSION_TTL_MS` | `devSessionTtlMs` | `parseInt(..., 10) || 0` | 開発用固定セッションの TTL |
| `DEV_SESSION_PATHS` | `devSessionPaths` | カンマ区切り分解後の配列 | 固定セッションを適用するパス一覧 |
| `LOGIN_USERNAME` | `loginUsername` | `admin` | 固定ログイン認証のユーザー名 |
| `LOGIN_PASSWORD` | `loginPassword` | `admin` | 固定ログイン認証のパスワード |
| `LOGIN_USER_ID` | `loginUserId` | `admin` | ログイン成功時の利用者ID |
| `LOGIN_SESSION_TTL_MS` | `loginSessionTtlMs` | `parseInt(..., 10) || 86400000` | 通常ログインセッション TTL |

## `createEnv` の仕様
- `process.env` から文字列値を読み取り、アプリ内部で扱いやすい `env` オブジェクトへ変換する。
- `DEV_SESSION_PATHS` は `parseSessionPaths` により、以下の規則で `string[]` へ変換する。
  - カンマ区切りで分割する。
  - 各要素の前後空白を除去する。
  - 空文字要素は除外する。
- `PORT` / `DEV_SESSION_TTL_MS` / `LOGIN_SESSION_TTL_MS` は 10 進整数へ変換し、不正値・未設定時は既定値へフォールバックする。

## 起動シーケンス
1. `createEnv(process.env)` で `env` を構築する。
2. `createApp(env)` で Express アプリを生成する。
3. `await app.locals.ready` で初期化完了を待機する。
4. 初期化失敗時は `console.error('アプリケーションの初期化に失敗しました', error)` を出力し、`process.exit(1)` で終了する。
5. 初期化成功時のみ `app.listen(env.port, ...)` を実行する。
6. listen 成功コールバックで `サーバーを起動しました: port=...` を出力する。
7. `hasDevelopmentSession(env)` が `true` の場合は、固定セッション有効化ログも追加出力する。
8. `server.on('error', ...)` で起動失敗を監視し、失敗時は `process.exit(1)` で終了する。

## `app.locals.ready` / `app.locals.close` の扱い
- `server.js` が直接利用するのは `app.locals.ready` のみである。
- `app.locals.ready` は、DB 同期など初期化処理が完了したことを示す Promise として扱う。
- `app.locals.close` はこのファイルでは未使用だが、`createApp` が公開するアプリケーション終了 API として保持される。
- したがって、起動責務は `ready` の待機まで、終了責務は上位の運用コードやテストから `close` を呼ぶ設計とする。

## `DevelopmentSession` に関する起動責務
- `hasDevelopmentSession(env)` を用いて、開発用固定セッション設定が有効かを起動時ログ判定に利用する。
- セッションストアへの事前登録は `createDependencies`、リクエスト適用は `setupMiddleware` が担うため、`server.js` は環境変数解釈と起動ログ出力に責務を限定する。
- 固定セッションの優先順位は `x-session-token` → `session_token` Cookie → 開発用固定セッションであり、その実行仕様自体は [setupMiddleware 設計書](/doc/5_api/controller/middleware/setupMiddleware/readme.md) を参照する。
- 詳細は [DevelopmentSession 設計書](/doc/5_api/controller/middleware/DevelopmentSession/readme.md) を参照する。

## 関連ドキュメント
- [createApp 設計書](/doc/4_application/app/createApp/readme.md)
- [createDependencies 設計書](/doc/4_application/app/createDependencies/readme.md)
- [setupMiddleware 設計書](/doc/5_api/controller/middleware/setupMiddleware/readme.md)
- [DevelopmentSession 設計書](/doc/5_api/controller/middleware/DevelopmentSession/readme.md)
