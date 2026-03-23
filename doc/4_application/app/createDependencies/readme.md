# createDependencies 設計書

## 概要
- `src/app/createDependencies.js` は、アプリケーション起動時に必要な永続化アダプター・アプリケーションサービス・ルートセッター群をまとめて生成する。
- SQLite / Sequelize 初期化、コンテンツ保存先ディレクトリ準備、ログイン認証、セッションストア、各種サービス組み立てを 1 箇所へ集約する。
- 開発用固定セッションが有効な場合は、`DevelopmentSession` 用のセッションレコードを起動時に事前登録する。

## 対象実装
- 実装: `src/app/createDependencies.js`

## 入力

### `env`
| 項目 | 必須性 | 用途 |
| --- | --- | --- |
| `databaseStoragePath` | 必須 | SQLite ファイルの保存先。親ディレクトリを自動生成する。 |
| `contentRootDirectory` | 必須 | メディアコンテンツ保存先。ディレクトリを自動生成する。 |
| `loginUsername` | 任意 | `StaticLoginAuthenticator` のユーザー名。未指定時は `admin`。 |
| `loginPassword` | 任意 | `StaticLoginAuthenticator` のパスワード。未指定時は `admin`。 |
| `loginUserId` | 任意 | ログイン成功時の利用者 ID。未指定時は `admin`。 |
| `loginSessionTtlMs` | 任意 | 通常ログインセッションの TTL。未指定時は `86400000`。 |
| `devSessionToken` | 条件付き | 開発用固定セッションのトークン。 |
| `devSessionUserId` | 条件付き | 開発用固定セッションの利用者 ID。 |
| `devSessionTtlMs` | 条件付き | 開発用固定セッションの TTL。正の整数時のみ有効。 |
| `devSessionPaths` | 任意 | 開発用固定セッションの適用対象パス一覧。生成処理では判定に使わず、他モジュールが参照する。 |

## 依存オブジェクトの生成責務

### 基盤層の生成
- `Sequelize` を SQLite 設定で生成する。
- `SequelizeUnitOfWork` を生成する。
- `SequelizeMediaRepository` / `SequelizeMediaQueryRepository` / `SequelizeUserRepository` を生成する。
- `InMemorySessionStateStore` を生成する。
- `MulterDiskStorageContentUploadAdapter` と `UUIDMediaIdValueGenerator` を生成する。
- `StaticLoginAuthenticator` を `env.loginUsername` / `env.loginPassword` / `env.loginUserId` から生成する。
- `SessionStateRegistrar` / `SessionTerminator` / `SessionStateAuthAdapter` を生成する。

### アプリケーションサービスの生成
- メディア系
  - `SearchMediaService`
  - `GetMediaDetailService`
  - `GetMediaContentWithNavigationService`
  - `UpdateMediaService`
  - `DeleteMediaService`
- ユーザー系
  - `GetFavoriteSummariesService`
  - `GetQueueService`
  - `AddFavoriteService`
  - `RemoveFavoriteService`
  - `AddQueueService`
  - `RemoveQueueService`
  - `LoginService`
  - `LogoutService`

### ルートセッターの集約
- 画面系・API 系のルート定義関数を `dependencies.routeSetters` に束ねる。
- `setupRoutes` はここで集約されたルートセッターのみを参照し、各モジュールの import を重複しない。

## 起動時ディレクトリ準備
- `databaseStoragePath` の親ディレクトリは `ensureParentDirectory` で再帰的に生成する。
- `contentRootDirectory` は `ensureDirectory` で再帰的に生成する。
- これにより、初回起動時でも保存先未作成を理由に初期化失敗しにくくする。

## `DevelopmentSession` の事前登録
- `hasDevelopmentSession(env)` が `true` の場合のみ、起動直後に `sessionStateStore.save(...)` を 1 回実行する。
- 登録内容は以下の通り。
  - `sessionToken: env.devSessionToken`
  - `userId: env.devSessionUserId`
  - `ttlMs: env.devSessionTtlMs`
- この事前登録により、`setupMiddleware` が注入した固定トークンを `SessionStateAuthAdapter` が通常セッションと同様に解決できる。
- 開発用固定セッションの有効条件そのものは [DevelopmentSession 設計書](/doc/5_api/controller/middleware/DevelopmentSession/readme.md) を参照する。

## `app.locals.ready` / `app.locals.close` の供給責務
- `dependencies.ready` は `mediaRepository.sync()` の Promise を保持する。
- `createApp` はこの Promise を `app.locals.ready` として公開する。
- `dependencies.close` は以下の順序で終了処理を行う。
  1. `await dependencies.ready`
  2. `await sequelize.close()`
- これにより、初期化未完了状態で DB 接続だけを閉じる不整合を避ける。

## 返却オブジェクト
- 返却値は、基盤アダプター・アプリケーションサービス・`routeSetters`・`ready`・`close` をまとめた `dependencies` オブジェクトである。
- `setupMiddleware` は主に `env` を使うが、`setupRoutes` は `dependencies` を使って各ルートへ必要サービスを注入する。

## 関連ドキュメント
- [createApp 設計書](/doc/4_application/app/createApp/readme.md)
- [setupMiddleware 設計書](/doc/5_api/controller/middleware/setupMiddleware/readme.md)
- [setupRoutes 設計書](/doc/5_api/controller/router/setupRoutes/readme.md)
- [DevelopmentSession 設計書](/doc/5_api/controller/middleware/DevelopmentSession/readme.md)
