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
| `SERVER_HOST` (`HOST` 互換) | `host` | 未指定時 `127.0.0.1`。`0.0.0.0` は `NODE_ENV=production` のときのみ許可し、それ以外は `127.0.0.1` へフォールバック | HTTP listen バインドアドレス |
| `DATABASE_STORAGE_PATH` | `databaseStoragePath` | `var/data/mangaviewer.sqlite` | SQLite 保存先 |
| `CONTENT_ROOT_DIRECTORY` | `contentRootDirectory` | `public/contents` | コンテンツ保存先 |
| `DEV_SESSION_TOKEN` | `devSessionToken` | 空文字 | 開発用固定セッショントークン |
| `DEV_SESSION_USER_ID` | `devSessionUserId` | 空文字 | 開発用固定セッションの利用者ID |
| `DEV_SESSION_TTL_MS` | `devSessionTtlMs` | `parseInt(..., 10) || 0` | 開発用固定セッションの TTL |
| `DEV_SESSION_PATHS` | `devSessionPaths` | カンマ区切り分解後の配列 | 固定セッションを適用するパス一覧 |
| `ENABLE_DEV_SESSION` | `enableDevSession` | 空文字 | 開発用固定セッションの明示有効化フラグ（`true` のみ有効） |
| `ALLOW_REMOTE_DEV_SESSION` | `allowRemoteDevSession` | 空文字 | 非 loopback bind で `ENABLE_DEV_SESSION=true` を強制許可する非常用フラグ（通常は禁止） |
| `FIXED_LOGIN_PASSWORD` (`LOGIN_PASSWORD` 互換) | `loginPassword` | 空文字 | 固定ログイン認証のパスワード |
| `FIXED_LOGIN_USER_ID` (`LOGIN_USER_ID` 互換) | `loginUserId` | 空文字 | ログイン成功時の利用者ID |
| `LOGIN_SESSION_TTL_MS` | `loginSessionTtlMs` | `parseInt(..., 10) || 86400000` | 通常ログインセッション TTL |

## `createEnv` の仕様
- `process.env` から文字列値を読み取り、アプリ内部で扱いやすい `env` オブジェクトへ変換する。
- `SERVER_HOST`（互換として `HOST`）は以下の規則で `env.host` を解決する。
  - 未指定時は `127.0.0.1` を採用する。
  - `0.0.0.0` が指定された場合は、`NODE_ENV=production` のときのみ採用する。
  - `NODE_ENV` が `production` 以外で `0.0.0.0` が指定された場合は `127.0.0.1` へフォールバックする。
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
5. 初期化成功時のみ `app.listen(env.port, env.host, ...)` を実行する。
6. listen 成功コールバックで `サーバーを起動しました: host=..., port=...` を出力する。
7. `NODE_ENV !== production` かつ `ENABLE_DEV_SESSION` が未指定の場合は、固定セッションが無効である旨を起動ログへ出力する。
8. `hasDevelopmentSession(env)` が `true` の場合は、固定セッション有効化ログも追加出力する。
9. `server.on('error', ...)` で起動失敗を監視し、失敗時は `process.exit(1)` で終了する。

## `app.locals.ready` / `app.locals.close` の扱い
- `server.js` が直接利用するのは `app.locals.ready` のみである。
- `app.locals.ready` は、DB 同期など初期化処理が完了したことを示す Promise として扱う。
- `app.locals.close` はこのファイルでは未使用だが、`createApp` が公開するアプリケーション終了 API として保持される。
- したがって、起動責務は `ready` の待機まで、終了責務は上位の運用コードやテストから `close` を呼ぶ設計とする。

## `DevelopmentSession` に関する起動責務
- `hasDevelopmentSession(env)` を用いて、開発用固定セッション設定が有効かを起動時ログ判定に利用する。
- 開発環境で `ENABLE_DEV_SESSION` が未指定の場合は無効として扱うため、起動時に誤設定検知ログを出力する。
- `ENABLE_DEV_SESSION=true` かつ `host` が loopback 以外の場合は起動を拒否する（`ALLOW_REMOTE_DEV_SESSION=true` を明示した非常時のみ回避可能）。
- セッションストアへの事前登録は `createDependencies`、リクエスト適用は `setupMiddleware` が担うため、`server.js` は環境変数解釈と起動ログ出力に責務を限定する。
- 固定セッションの優先順位は `x-session-token` → `session_token` Cookie → 開発用固定セッションであり、その実行仕様自体は [setupMiddleware 設計書](/doc/5_api/controller/middleware/setupMiddleware/readme.md) を参照する。
- 詳細は [DevelopmentSession 設計書](/doc/5_api/controller/middleware/DevelopmentSession/readme.md) を参照する。


## 運用CLI仕様: `npm run import -- <dir>`

### コマンド形式と引数
- 実行形式: `npm run import -- <dir>`
- `<dir>`: 取り込み対象 zip を格納したディレクトリのパス（必須）。
- `<dir>` は絶対パス/相対パスのどちらも受け付ける。相対パスは実行時カレントディレクトリ基準で解決する。

### 実行前検証
- 実処理開始前に、以下を順に検証する。
  1. 引数 `<dir>` が指定されていること。
  2. `<dir>` が存在すること。
  3. `<dir>` がディレクトリであること。
  4. `<dir>` に対して読み取り権限があること。
- 上記のいずれかを満たさない場合、zip 走査・登録処理は実行せずに異常終了する。

### 終了コード規約
- 本節は運用CLIの終了コード規約の**唯一の定義源**である。
- `ImportZipsService` はユースケース結果種別（`SUCCESS` / `PARTIAL_FAILURE` / `INVALID_INPUT`）までを返し、数値終了コードへの変換責務は CLI が担う。
- 実行前検証（引数不足、フォルダ不存在、権限不足など）の判定は CLI 層のみで実施し、`ImportZipsService` 側で終了コードを直接決めない。
- `0`: 正常終了（対象 zip がすべて成功、または対象 zip が 0 件）。
- `1`: 処理実行は完了したが、1件以上の zip が失敗。
- `2`: 実行前検証エラー（引数不正、フォルダ不存在、権限不足など）により未実行終了。

### 実行ログ仕様（人間可読 + JSONL）
- ログは同一実行で **人間可読ログ** と **JSONLログ** の 2 系統を出力する。
- 人間可読ログ:
  - 標準出力/標準エラーに、開始・進捗・zip単位結果・最終集計・終了コードを出力する。
  - 運用者が CLI 画面だけで状態判断できる粒度で記録する。
- JSONLログ:
  - 1行1JSON の形式で出力する。
  - 少なくとも `event`, `timestamp`, `zipName`, `status`, `reason`, `mediaId`（成功時）, `ignoredFiles`, `summary`（集計時）を含める。
  - `event` は `start` / `zip_result` / `summary` / `finish` を使い分ける。

### 0件 zip 時の扱い
- `<dir>` 配下に zip が 0 件の場合は、処理対象なしとして正常終了（終了コード `0`）する。
- 人間可読ログと JSONLログの双方に「対象 0 件」である旨の集計を出力する。

### 一部失敗時の扱い
- ある zip が失敗しても、後続 zip の取り込みは継続実行する（fail-fast にしない）。
- 実行終了時に失敗件数を最終集計へ反映し、失敗件数が 1 件以上の場合は終了コード `1` を返す。
- 各 zip の成否は個別に記録し、どの zip が失敗したかを追跡可能にする。

## 関連ドキュメント
- [createApp 設計書](/doc/4_application/app/createApp/readme.md)
- [createDependencies 設計書](/doc/4_application/app/createDependencies/readme.md)
- [setupMiddleware 設計書](/doc/5_api/controller/middleware/setupMiddleware/readme.md)
- [DevelopmentSession 設計書](/doc/5_api/controller/middleware/DevelopmentSession/readme.md)

## 運用メモ
- 開発用固定セッション（DEV_SESSION）はローカル閉域（loopback bind）のみで利用する。`SERVER_HOST` を外部公開アドレスへ向ける環境では禁止する。
- 本番・共有環境では DEV_SESSION を使用しない。検証用の一時環境を含め、第三者が到達可能な経路では無効化を維持する。
- 開発用固定セッションを使う場合は、自動テストでサーバー起動する `.env.test` に `ENABLE_DEV_SESSION=true` を明示して起動する。
- 本リポジトリでは `npm run start:test` が `.env.test` を読み込む自動テスト用の起動コマンドになっている。
- 外部公開が必要な運用（例: リバースプロキシ背後の本番公開）でのみ `NODE_ENV=production` かつ `SERVER_HOST=0.0.0.0` を明示する。
- 開発・検証用途では `SERVER_HOST` 未指定（既定値 `127.0.0.1`）を推奨し、不要な外部公開を防止する。
