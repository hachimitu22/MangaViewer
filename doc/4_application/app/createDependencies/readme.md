# createDependencies 設計書

## 概要
- `src/app/createDependencies.js` は、アプリケーション起動時に必要な永続化アダプター・アプリケーションサービス・ルートセッター群をまとめて生成する。
- SQLite / Sequelize 初期化、コンテンツ保存先ディレクトリ準備、ログイン認証、各種サービス組み立てを 1 箇所へ集約する。

## 対象実装
- 実装: `src/app/createDependencies.js`

## 入力

### `env`
| 項目 | 必須性 | 用途 |
| --- | --- | --- |
| `databaseStoragePath` | 必須 | SQLite ファイルの保存先。親ディレクトリを自動生成する。 |
| `contentRootDirectory` | 必須 | メディアコンテンツ保存先。ディレクトリを自動生成する。 |

## 依存オブジェクトの生成責務

### 基盤層の生成
- `Sequelize` を SQLite 設定で生成する。
- `SequelizeUnitOfWork` を生成する。
- `SequelizeMediaRepository` / `SequelizeMediaQueryRepository` / `SequelizeUserRepository` を生成する。
- `InMemorySessionStateStore` を生成する。
- `MulterDiskStorageContentUploadAdapter` と `UUIDMediaIdValueGenerator` を生成する。
- `SessionStateRegistrar` / `SessionTerminator` / `SessionStateAuthAdapter` を生成する。

### アプリケーションサービスの生成
- メディア系
  - `SearchMediaService`
  - `GetMediaDetailService`
  - `GetMediaContentWithNavigationService`
  - `UpdateMediaService`
  - `DeleteMediaService`
- 認証・セッション系
  - `LoginService`
  - `LogoutService`

### ルートセッターの集約
- 画面系・API 系のルート定義関数を `dependencies.routeSetters` に束ねる。
- 画面系には `setRouterRootGet`（`GET /` の遷移制御）を含める。
- `setupRoutes` はここで集約されたルートセッターのみを参照し、各モジュールの import を重複しない。

## 起動時ディレクトリ準備
- `databaseStoragePath` の親ディレクトリは `ensureParentDirectory` で再帰的に生成する。
- `contentRootDirectory` は `ensureDirectory` で再帰的に生成する。
- これにより、初回起動時でも保存先未作成を理由に初期化失敗しにくくする。

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

- [createDependencies small テスト観点](/doc/4_application/app/createDependencies/testcase.small.md)
- [createDependencies medium テスト観点](/doc/4_application/app/createDependencies/testcase.medium.md)
