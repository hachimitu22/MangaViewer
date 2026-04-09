# DevelopmentSession

## 概要
- 開発環境でのみ利用する、固定セッショントークン注入機能。
- `src/app/developmentSession.js` は有効条件判定（`hasDevelopmentSession` / `shouldApplyDevelopmentSession`）だけを担う。
- 固定セッションの起動配線・環境変数解釈・優先順位・ルート適用は、アプリ全体設計として別文書へ分離して管理する。

## 開発支援機能としての位置づけ
- 認証付き画面や API の開発・動作確認時に、毎回ログイン操作を行わずに既知のユーザーとしてアクセスできるようにする。
- 通常ログインを置き換える本番機能ではなく、画面確認・手動疎通・ローカル開発を支援する補助手段として位置づける。
- 想定利用者は開発者・ローカル検証者に限定し、公開環境・本番環境・不特定多数が接続する環境では利用しない。

## 対象実装
- 実装: `src/app/developmentSession.js`

## 判定責務

### `hasDevelopmentSession(env)`
以下をすべて満たす場合のみ `true` と判定する。
- `enableDevSession` が文字列 `'true'`
- `devSessionToken` が空文字ではない `string`
- `devSessionUserId` が空文字ではない `string`
- `devSessionTtlMs` が正の整数

### `shouldApplyDevelopmentSession({ env, requestPath })`
以下をすべて満たす場合のみ `true` と判定する。
- `hasDevelopmentSession(env)` が `true`
- `requestHost`（未指定時は `env.serverHost`、それも未指定時は `localhost`）が loopback（`localhost` / `127.0.0.1` / `::1` / `127.*`）である
- `env.devSessionPaths` が配列である
- `requestPath` が `env.devSessionPaths` に完全一致で含まれる

### `resolveDevelopmentSessionApplication(...)` の拒否理由
- `explicit_flag_disabled`: `ENABLE_DEV_SESSION` が未有効。
- `environment_not_allowed`: `NODE_ENV` が `development` / `test` 以外。
- `configuration_incomplete`: `DEV_SESSION_*` の必須設定不足。
- `request_host_not_loopback`: リクエスト `host` が loopback 以外。
- `paths_not_configured`: `DEV_SESSION_PATHS` が配列ではない。
- `path_not_targeted`: 対象パス不一致。
- `enabled`: 適用可。

## 対象パス仕様
- `DEV_SESSION_PATHS` に列挙したパスに対してのみ固定セッションを補完する前提で判定する。
- 判定は `requestPath` の完全一致で行い、前方一致・ワイルドカード・正規表現は扱わない。
- 例
  - 対象: `/screen/entry`, `/api/media`
  - 非対象: `/unknown`, `/screen/entry/subpath`

## セキュリティ上の前提
- 固定トークンは認証回避のための開発補助機能であるため、秘密情報として扱い、リポジトリへハードコードしない。
- 本機能は本番利用を想定しない。公開環境で有効化すると、対象パスに対して固定ユーザーへ成り代わり可能になるため禁止する。
- 本機能は loopback のローカル閉域利用に限定する。共有開発環境・プレビュー環境・本番環境での有効化は禁止する。
- 対象パスは最小限に限定し、開発に不要な管理系・更新系エンドポイントへ無制限に適用しない。

## アプリ全体設計への参照
- 起動時の `env` 解釈: [server 設計書](/doc/4_application/app/server/readme.md)
- 固定セッションの事前登録: [createDependencies 設計書](/doc/4_application/app/createDependencies/readme.md)
- `x-session-token` / `session_token` Cookie / 開発用固定セッションの優先順位: [setupMiddleware 設計書](/doc/5_api/controller/middleware/setupMiddleware/readme.md)
- 未定義ルート時の共通 404 JSON: [setupRoutes 設計書](/doc/5_api/controller/router/setupRoutes/readme.md)
- アプリ全体の配線: [createApp 設計書](/doc/4_application/app/createApp/readme.md)
