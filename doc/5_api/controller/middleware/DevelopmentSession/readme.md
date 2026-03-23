# DevelopmentSession

## 概要
- 開発環境でのみ利用する、固定セッショントークン注入機能。
- `src/app/developmentSession.js` が有効条件判定（`hasDevelopmentSession` / `shouldApplyDevelopmentSession`）を担い、`src/app/setupMiddleware.js` が対象リクエストへ `req.session.session_token` を補完する。
- `src/app/createDependencies.js` は有効化時に固定セッションを `sessionStateStore` へ事前登録し、`src/server.js` は環境変数の解釈と起動ログ出力を担当する。
- 通常ログインを置き換える本番機能ではなく、画面確認・手動疎通・ローカル開発を支援する補助手段として位置づける。

## 開発支援機能としての位置づけ
- 認証付き画面やAPIの開発・動作確認時に、毎回ログイン操作を行わずに既知のユーザーとしてアクセスできるようにする。
- `x-session-token` ヘッダや `session_token` Cookie が未設定のときだけ固定セッションを補完し、通常の認証導線を優先する。
- 想定利用者は開発者・ローカル検証者に限定し、公開環境・本番環境・不特定多数が接続する環境では利用しない。

## 環境変数

| 名前 | 必須条件 | 役割 |
| --- | --- | --- |
| `DEV_SESSION_TOKEN` | `string` かつ空文字不可 | 開発用に固定注入する `session_token` 値 |
| `DEV_SESSION_USER_ID` | `string` かつ空文字不可 | 固定セッションに紐づく利用者ID |
| `DEV_SESSION_TTL_MS` | 正の整数 | 固定セッションをストアへ保持する有効期限（ミリ秒） |
| `DEV_SESSION_PATHS` | カンマ区切り文字列 | 固定セッションを自動補完する対象パス一覧 |

- `server.js` の `createEnv` では `DEV_SESSION_PATHS` をカンマ区切りで分割し、前後空白を除去した `devSessionPaths: string[]` に変換する。
- `DEV_SESSION_TTL_MS` は `Number.parseInt(..., 10)` で整数化し、未設定や不正値は `0` 扱いとなる。

## 有効条件

### `hasDevelopmentSession`
以下をすべて満たす場合のみ `true` と判定する。
- `devSessionToken` が空文字ではない `string`
- `devSessionUserId` が空文字ではない `string`
- `devSessionTtlMs` が正の整数

### `shouldApplyDevelopmentSession`
以下をすべて満たす場合のみ `true` と判定する。
- `hasDevelopmentSession(env)` が `true`
- `env.devSessionPaths` が配列である
- `requestPath` が `env.devSessionPaths` に完全一致で含まれる

## 対象パス
- `DEV_SESSION_PATHS` に列挙したパスに対してのみ固定セッションを補完する。
- 判定は `req.path` の完全一致で行うため、前方一致・ワイルドカード・正規表現は扱わない。
- 対象例
  - `/screen/entry`
  - `/api/media`
- 非対象例
  - `DEV_SESSION_PATHS` に未登録の `/unknown`
  - `/screen/entry/subpath` のような部分一致のみのパス

## セキュリティ上の前提
- 固定トークンは認証回避のための開発補助機能であるため、秘密情報として扱い、リポジトリへハードコードしない。
- 本機能は本番利用を想定しない。公開環境で有効化すると、対象パスに対して固定ユーザーへ成り代わり可能になるため禁止する。
- 対象パスは最小限に限定し、開発に不要な管理系・更新系エンドポイントへ無制限に適用しない。
- `x-session-token` ヘッダおよび `session_token` Cookie が優先されるため、明示的なログイン結果や検証用トークンを上書きしない。
- `DEV_SESSION_TTL_MS` を有限値にすることで、開発用セッションも無期限に残置しない。

## 配線

### `server.js`
- `process.env` から `DEV_SESSION_TOKEN` / `DEV_SESSION_USER_ID` / `DEV_SESSION_TTL_MS` / `DEV_SESSION_PATHS` を読み取り、`createEnv` でアプリケーション向けの `env` へ変換する。
- `startServer` では `hasDevelopmentSession(env)` が `true` の場合に、起動ログへ固定セッション有効化状態（`userId` と `paths`）を出力する。

### `createDependencies`
- `InMemorySessionStateStore` 初期化後、`hasDevelopmentSession(env)` が `true` の場合は `sessionStateStore.save(...)` を実行する。
- 登録内容は以下の3項目。
  - `sessionToken: env.devSessionToken`
  - `userId: env.devSessionUserId`
  - `ttlMs: env.devSessionTtlMs`
- これにより、後続の `SessionAuthMiddleware` が固定トークンから `userId` を解決できるようにする。

### `setupMiddleware`
- リクエストごとに `req.session` ヘルパーを初期化する。
- `x-session-token` ヘッダが存在する場合は、その値を `req.session.session_token` へ設定する。
- ヘッダがなく `session_token` Cookie が存在する場合は、その値を `req.session.session_token` へ設定する。
- ヘッダ・Cookie のどちらも無い場合のみ、`shouldApplyDevelopmentSession({ env, requestPath: req.path })` を評価する。
- `true` のとき `req.session.session_token = env.devSessionToken` を設定し、以降の認証ミドルウェアで通常セッションと同様に扱う。

## 認証フロー上の扱い
1. `server.js` が環境変数から開発用固定セッション設定を組み立てる。
2. `createDependencies` が固定セッションをセッションストアへ保存する。
3. `setupMiddleware` が対象パスへのリクエストに限り固定トークンを `req.session.session_token` へ補完する。
4. `SessionAuthMiddleware` が通常セッションと同じ経路で `session_token` を検証し、`userId` を解決する。

## 運用上の注意
- CI やステージングで利用する場合も「開発者のみが閉域で利用する」ことを明文化した上で限定運用する。
- ログに `userId` と対象パスが出力されるため、共有ログ基盤へ送る場合は閲覧権限を制御する。
- 対象パス追加時は、認証要否と副作用の有無を確認してから `DEV_SESSION_PATHS` に追記する。
