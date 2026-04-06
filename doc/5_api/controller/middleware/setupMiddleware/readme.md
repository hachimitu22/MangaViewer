# setupMiddleware 設計書

## 概要
- `src/app/setupMiddleware.js` は、Express アプリケーション全体へ共通適用するミドルウェアを登録する。
- ビュー設定、JSON / form-urlencoded パーサー、簡易 `req.session` ヘルパー生成、セッショントークンの入力正規化を担当する。
- `SessionAuthMiddleware` が参照する `req.session.session_token` を、Cookie と開発用固定セッションの優先順位に従って補完する。

## 対象実装
- 実装: `src/app/setupMiddleware.js`

## 入力

### `env`
| 項目 | 用途 |
| --- | --- |
| `devSessionToken` | 開発用固定セッションとして `req.session.session_token` に補完する値 |
| `devSessionPaths` | 固定セッション自動補完の対象パス一覧 |
| `devSessionUserId` | `shouldApplyDevelopmentSession` の前提条件となる固定セッション設定の一部 |
| `devSessionTtlMs` | `shouldApplyDevelopmentSession` の前提条件となる固定セッション設定の一部 |

### `dependencies`
- 現行実装では利用しないが、`createApp` からシグネチャを統一して受け取る。
- 将来、共通ミドルウェアへ依存オブジェクトを注入する拡張余地として保持する。

## ビュー・パーサー設定
- `views` ディレクトリを `src/views` に設定する。
- `view engine` を `ejs` に設定する。
- `env.contentRootDirectory` が指定されている場合、`/contents` 配下に `express.static(env.contentRootDirectory)` を登録する。
- `express.json()` を登録し、JSON リクエストボディを解釈可能にする。
- `express.urlencoded({ extended: true })` を登録し、フォーム投稿を解釈可能にする。

## `req.session` ヘルパーの扱い
- 各リクエストで `req.context` を未設定なら空オブジェクトで初期化する。
- `attachSessionHelpers(req)` により `req.session` を準備する。
- `req.session.regenerate(callback)` は、`req.session` を空オブジェクトへ差し替えた後に再帰的にヘルパーを付与し、`callback(null)` を返す。
- `req.session.destroy(callback)` も同様に、`req.session` を空オブジェクトへ差し替えてから `callback(null)` を返す。
- この簡易実装により、`SessionStateRegistrar` / `SessionTerminator` が期待する `regenerate` / `destroy` API を最小限満たす。

## セッショントークン解決優先順位
`req.session.session_token` は次の優先順位で 1 つだけ採用する。

1. `Cookie` ヘッダ内の `session_token` Cookie
2. 開発用固定セッション (`DevelopmentSession`)

### 優先順位詳細
- `session_token` Cookie が非空文字列なら、その値を採用する。
- Cookie が無い場合に限り、`shouldApplyDevelopmentSession({ env, requestPath: req.path })` を評価する。
- `shouldApplyDevelopmentSession(...)` が `true` のときのみ `env.devSessionToken` を補完する。
- したがって、開発用固定セッションは Cookie で明示指定された通常セッションを上書きしない。
- 互換期間中は `x-session-token` を検知した場合のみ監査ログ (`auth.legacy_session_token_header.detected`) を出力する。ログには件数・送信元IP・User-Agentのみを含み、トークン値は記録しない。

## Cookie 解析
- `parseCookieHeader(cookieHeader)` は `Cookie` ヘッダを `;` 区切りで分解し、`key=value` 形式だけを採用する。
- `=` を含まない要素や空キーは無視する。
- 複数 Cookie が存在する場合はオブジェクトへ格納し、`session_token` のみを参照する。

## `DevelopmentSession` との関係
- 開発用固定セッションの有効条件判定は `src/app/developmentSession.js` の `shouldApplyDevelopmentSession` に委譲する。
- `setupMiddleware` は「どのリクエストに固定トークンを補完するか」の実行責務のみを担う。
- 起動時のセッションストア事前登録は `createDependencies` の責務であり、本モジュールでは行わない。
- 詳細は [DevelopmentSession 設計書](/doc/5_api/controller/middleware/DevelopmentSession/readme.md) を参照する。

## 後続ミドルウェアへの契約
- 認証が必要なルートでは、後続の `SessionAuthMiddleware` が `req.session.session_token` を検証する。
- そのため、本モジュールは認証判定そのものを行わず、入力経路の統一だけを担う。

## 関連ドキュメント
- [SessionAuthMiddleware 設計書](/doc/5_api/controller/middleware/SessionAuthMiddleware/readme.md)
- [createDependencies 設計書](/doc/4_application/app/createDependencies/readme.md)
- [DevelopmentSession 設計書](/doc/5_api/controller/middleware/DevelopmentSession/readme.md)
