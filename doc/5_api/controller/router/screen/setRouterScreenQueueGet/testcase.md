# router (GET /screen/queue) テストケース

## テストケース一覧
- [GET /screen/queue に認証・描画の2ハンドラーを登録する](#get-screenqueue-に認証描画の2ハンドラーを登録する)
- [登録済みハンドラーを順に実行するとクエリ条件付きのあとで見る一覧画面を描画する](#登録済みハンドラーを順に実行するとクエリ条件付きのあとで見る一覧画面を描画する)
- [一覧取得で例外が発生した場合は next に委譲する](#一覧取得で例外が発生した場合は-next-に委譲する)

---

### GET /screen/queue に認証・描画の2ハンドラーを登録する
- **前提**
  - `router.get` をモック化する。
  - `authResolver` / `getQueueService` は有効な依存を注入する。
- **操作**
  - `setRouterScreenQueueGet` を実行する。
- **結果**
  - `router.get` が1回呼ばれる。
  - 第1引数が `/screen/queue` である。
  - 第2引数以降に2つのハンドラーが設定される。
  - 第1ハンドラーに認証ミドルウェアが適用される。

---

### 登録済みハンドラーを順に実行するとクエリ条件付きのあとで見る一覧画面を描画する
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `getQueueService.execute` は `sort` / `queuePage` / `totalCount` / `mediaOverviews` を含む結果を返す。
- **操作**
  - 登録済みの2ハンドラーを順に実行する。
- **結果**
  - 認証処理が `session_token` で呼ばれる。
  - 一覧取得処理が `req.context.userId` とクエリパラメータ `sort` / `queuePage` を使って実行される。
  - `screen/queue` が `pageTitle` / `currentConditions` / `pagination` / `mediaOverviews` を含む表示データで描画される。

---

### 一覧取得で例外が発生した場合は next に委譲する
- **前提**
  - `getQueueService.execute` が例外を送出する。
- **操作**
  - 描画ハンドラーを実行する。
- **結果**
  - `next(error)` が呼ばれる。

## medium テストで担保する観点
- `__tests__/medium/controller/router/screen/setRouterScreenQueueGet.test.js` では、Express アプリへ当該ルーターを登録した状態で `GET /screen/queue` を実行し、認証済みセッションから HTML を返せることを担保する。
- medium テストでは `SessionStateAuthAdapter` により `x-session-token` から `userId` を解決し、認証ミドルウェアが実際に適用されることを担保する。
- medium テストでは `GetQueueService` 相当の依存が返した並び順・ページ番号・総件数・トグル表示状態を描画結果へ反映し、`screen/queue` テンプレートが応答に使われることを担保する。
