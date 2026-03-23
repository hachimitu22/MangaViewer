# setupRoutes 設計書

## 概要
- `src/app/setupRoutes.js` は、画面系・API 系の既存ルートを 1 つの Express Router へ登録し、最後に共通 404 JSON フォールバックを設定する。
- 個々の URL 仕様は各 `setRouter...` モジュールへ委譲し、本モジュールは登録順序と依存注入の統括を担う。
- ルート未一致時は画面ルート・API ルートを問わず同一の JSON 404 応答を返す。

## 対象実装
- 実装: `src/app/setupRoutes.js`

## 入力

### `env`
- 現行実装では参照しない。
- `createApp` からシグネチャ統一のため受け取り、将来的に環境別ルーティング分岐が必要になった場合の拡張余地とする。

### `dependencies`
`createDependencies` が構築したオブジェクト群を受け取り、各ルートへ必要な依存を注入する。

主な利用項目:
- `authResolver`
- `getMediaDetailService`
- `getMediaContentWithNavigationService`
- `getFavoriteSummariesService`
- `getQueueService`
- `searchMediaService`
- `loginService`
- `logoutService`
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
  - entry / detail / edit / error / favorite / login / queue / search / summary / viewer
- API ルートを登録する。
  - login / logout / media post / media patch / media delete / favorite and queue
- 各登録時に必要な依存だけを明示的に渡すことで、各 `setRouter...` の入力契約を固定する。

## 登録順序
1. 画面ルート群を登録する。
2. 認証・更新を含む API ルート群を登録する。
3. `app.use(router)` でまとめた Router をアプリへマウントする。
4. 既存ルート登録後に、最後段の共通 404 ハンドラーを `app.use((_req, res) => { ... })` で追加する。

## 共通 404 JSON フォールバック仕様
- 既存の画面ルート・API ルートのいずれにも一致しなかった場合に発火する。
- HTTP ステータスコードは `404` を返す。
- レスポンスボディは JSON `{ "message": "Not Found" }` を返す。
- 画面 URL でも HTML 画面を返さず、API と同一の JSON 応答へ統一する。
- このフォールバックは `app.use(router)` の後に登録することで、正常ルートの応答を妨げない。

## `DevelopmentSession` との関係
- `setupRoutes` 自体は `DevelopmentSession` を直接判定しない。
- ただし、認証必須ルートに注入される `authResolver` は、`setupMiddleware` が補完した `req.session.session_token` を前提に動作する。
- そのため、開発用固定セッションが有効な場合でも、各ルートは通常の認証フローと同じ経路で利用される。
- 詳細は [DevelopmentSession 設計書](/doc/5_api/controller/middleware/DevelopmentSession/readme.md) を参照する。

## 関連ドキュメント
- [未定義ルート共通 404 ハンドラー](/doc/5_api/controller/router/notFound/setupRoutesNotFoundHandler/readme.md)
- [setupMiddleware 設計書](/doc/5_api/controller/middleware/setupMiddleware/readme.md)
- [createDependencies 設計書](/doc/4_application/app/createDependencies/readme.md)
