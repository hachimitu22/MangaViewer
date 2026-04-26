# setupRoutes 設計書

## 概要
- `src/app/setupRoutes.js` は、画面系・API 系の既存ルートを 1 つの Express Router へ登録し、最後に共通 404 JSON フォールバックを設定する。
- 個々の URL 仕様は各 `setRouter...` モジュールへ委譲し、本モジュールは登録順序と依存注入の統括を担う。
- 未定義ルート時の 404 応答も `setupRoutes` の責務として扱う。

## 対象実装
- 実装: `src/app/setupRoutes.js`

## 入力

### `env`
- 現行実装では参照しない。
- `createApp` からシグネチャ統一のため受け取り、将来的に環境別ルーティング分岐が必要になった場合の拡張余地とする。

### `dependencies`
`createDependencies` が構築したオブジェクト群を受け取り、各ルートへ必要な依存を注入する。

主な利用項目:
- `getMediaDetailService`
- `getMediaContentWithNavigationService`
- `getFavoriteSummariesService`
- `getQueueService`
- `searchMediaService`
- `saveAdapter`
- `mediaIdValueGenerator`
- `mediaRepository`
- `unitOfWork`
- `updateMediaService`
- `deleteMediaService`
- `addFavoriteService`
- `removeFavoriteService`
- `addQueueService`
- `removeQueueService`
- `routeSetters`

## ルート登録責務
- `express.Router()` を生成する。
- 画面ルートを登録する。
  - root(/) / entry / detail / edit / error / favorite / search / summary / viewer
- API ルートを登録する。
  - media post / media patch / media delete
- 各登録時に必要な依存だけを明示的に渡すことで、各 `setRouter...` の入力契約を固定する。

## 登録順序
1. 画面ルート群を登録する。
2. 更新系を含む API ルート群を登録する。
3. `app.use(router)` でまとめた Router をアプリへマウントする。
4. 既存ルート登録後に、最後段の共通 404 ハンドラーを `app.use((_req, res) => { ... })` で追加する。

## 404 ハンドラー仕様（`setupRoutes.js` 末尾）
- `app.use(router)` 通過後もレスポンス未確定で、画面/API の既存ルートのいずれにも一致しない場合に発火する。
- HTTP ステータスコードは `404` を返す。
- レスポンスボディは JSON `{ "message": "Not Found" }` を返す。
- 画面 URL と API URL を区別せず、未定義ルート時の共通フォールバックとして適用する。
- 本ハンドラーは `setupRoutes` の責務に含まれ、個別 `setRouter...` モジュールでは扱わない。

## 関連テスト
- [small テスト観点](/doc/5_api/controller/router/setupRoutes/testcase.small.md)
- [medium テスト観点](/doc/5_api/controller/router/setupRoutes/testcase.medium.md)

## 関連ドキュメント
- [setupMiddleware 設計書](/doc/5_api/controller/middleware/setupMiddleware/readme.md)
- [createDependencies 設計書](/doc/4_application/app/createDependencies/readme.md)
