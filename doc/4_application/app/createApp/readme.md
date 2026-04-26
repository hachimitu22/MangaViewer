# createApp 設計書

## 概要
- `src/app.js` の `createApp(env)` は、Express アプリケーションの生成とアプリ全体の初期配線を担当する。
- アプリケーション起動時に `createDependencies`・`setupMiddleware`・`setupRoutes` を順に呼び出し、HTTP 受け付け前に必要な依存関係とルーティングをまとめて束ねる。
- 起動時設定は `env` 経由で下位モジュールへ引き渡し、`createApp` 自身は判定ロジックを持たない。

## 対象実装
- 実装: `src/app.js`
- 関連: `src/app/createDependencies.js`
- 関連: `src/app/setupMiddleware.js`
- 関連: `src/app/setupRoutes.js`

## 入力

### `env`
`createApp(env)` は、少なくとも以下の起動設定をそのまま下位モジュールへ中継する。

| 項目 | 用途 | 主な利用先 |
| --- | --- | --- |
| `databaseStoragePath` | SQLite ファイル格納先 | `createDependencies` |
| `contentRootDirectory` | コンテンツ保存先ディレクトリ | `createDependencies` |
| 開発用固定認証に関する設定群 | 固定認証の事前登録と自動適用の制御 | `createDependencies` / `setupMiddleware` |

- `port` は `server.js` が `listen` にだけ利用するため、`createApp` 自体では参照しない。
- `env` は `app.locals.env` に保存し、起動後の参照元として残す。

## 依存オブジェクト生成責務との関係
- 依存オブジェクトの実生成責務は `createDependencies(env)` に委譲する。
- `createApp` 自身は各依存を個別生成せず、生成済みオブジェクトを `app.locals.dependencies` として公開する。
- これにより、依存構築・ミドルウェア設定・ルート設定の責務を分離し、設計書もモジュール単位で保守できる。

## 処理フロー
1. `express()` で `app` を生成する。
2. `createDependencies(env)` を呼び、永続化・アプリケーションサービス・ルートセッター群を束ねた `dependencies` を生成する。
3. `app.locals.env` に起動設定を保存する。
4. `app.locals.dependencies` に依存オブジェクト群を保存する。
5. `app.locals.ready` / `app.locals.close` を `dependencies` から転写する。
6. `setupMiddleware(app, { env, dependencies })` を実行する。
7. `setupRoutes(app, { env, dependencies })` を実行する。
8. 初期化済み `app` を返す。

## `app.locals.ready` / `app.locals.close` の扱い
- `app.locals.ready` は、依存生成側で用意した初期化完了 Promise をそのまま保持する。
- `server.js` は `listen` 前に `await app.locals.ready` を実行し、DB スキーマ同期失敗時に起動を中断する。
- `app.locals.close` は、`ready` 完了後に接続クローズを実行する非同期関数として保持する。
- `createApp` は `ready` / `close` を再定義せず、アプリ利用者が `app.locals` 経由で一貫したライフサイクル API を扱えるようにする。

## 開発用固定認証との関連
- 開発用固定認証の事前登録責務は `createDependencies`、リクエスト単位の適用判定は `setupMiddleware` が担う。
- `createApp` は `env` と `dependencies` を両モジュールへ渡す接続点として機能する。

## 関連ドキュメント
- [createDependencies 設計書](/doc/4_application/app/createDependencies/readme.md)
- [setupMiddleware 設計書](/doc/5_api/controller/middleware/setupMiddleware/readme.md)
- [setupRoutes 設計書](/doc/5_api/controller/router/setupRoutes/readme.md)
- [server 設計書](/doc/4_application/app/server/readme.md)
- [createApp small テストケース](/doc/4_application/app/createApp/testcase.small.md)
- [createApp medium テストケース](/doc/4_application/app/createApp/testcase.medium.md)
