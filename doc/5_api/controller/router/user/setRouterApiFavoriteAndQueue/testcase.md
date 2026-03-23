# router (favorite / queue API) テストケース

## テストケース一覧
- [favorite / queue の5ルートを登録する](#favorite--queue-の5ルートを登録する)
- [favorite の PUT / DELETE で対応サービスが呼ばれる](#favorite-の-put--delete-で対応サービスが呼ばれる)
- [queue の PUT / POST / DELETE で対応サービスが呼ばれる](#queue-の-put--post--delete-で対応サービスが呼ばれる)
- [サービス実行で例外が発生した場合は next に委譲する](#サービス実行で例外が発生した場合は-next-に委譲する)

---

### favorite / queue の5ルートを登録する
- **前提**
  - `router.put` / `router.post` / `router.delete` をモック化する。
  - 認証・各サービスは有効な依存を注入する。
- **操作**
  - `setRouterApiFavoriteAndQueue` を実行する。
- **結果**
  - `PUT` が2回、`POST` が1回、`DELETE` が2回呼ばれる。
  - それぞれに認証ハンドラーと実処理ハンドラーが設定される。

---

### favorite の PUT / DELETE で対応サービスが呼ばれる
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `addFavoriteService.execute` / `removeFavoriteService.execute` は成功する。
- **操作**
  - 登録済みの favorite 用ハンドラーを順に実行する。
- **結果**
  - `mediaId` と `userId` を含む Query で各サービスが呼ばれる。
  - `200` + `code: 0` が返る。

---

### queue の PUT / POST / DELETE で対応サービスが呼ばれる
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `addQueueService.execute` / `removeQueueService.execute` は成功する。
- **操作**
  - 登録済みの queue 用ハンドラーを順に実行する。
- **結果**
  - `PUT` / `POST` は `addQueueService.execute` を呼ぶ。
  - `DELETE` は `removeQueueService.execute` を呼ぶ。
  - いずれも `200` + `code: 0` が返る。

---

### サービス実行で例外が発生した場合は next に委譲する
- **前提**
  - 対象サービスが例外を送出する。
- **操作**
  - 登録済みハンドラーを実行する。
- **結果**
  - `next(error)` が呼ばれる。
