# router (favorite / queue API) テストケース

## テストケース一覧
- [favorite / queue の4ルートを登録する](#favorite--queue-の4ルートを登録する)
- [favorite の PUT / DELETE で対応サービスが呼ばれる](#favorite-の-put--delete-で対応サービスが呼ばれる)
- [queue の PUT / DELETE で対応サービスが呼ばれる](#queue-の-put--delete-で対応サービスが呼ばれる)
- [サービス実行で例外が発生した場合は next に委譲する](#サービス実行で例外が発生した場合は-next-に委譲する)

---

### favorite / queue の4ルートを登録する
- **前提**
  - `router.put` / `router.delete` をモック化する。
  - 認証・各サービスは有効な依存を注入する。
- **操作**
  - `setRouterApiFavoriteAndQueue` を実行する。
- **結果**
  - `PUT` が2回、`DELETE` が2回呼ばれる。
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

### queue の PUT / DELETE で対応サービスが呼ばれる
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `addQueueService.execute` / `removeQueueService.execute` は成功する。
- **操作**
  - 登録済みの queue 用ハンドラーを順に実行する。
- **結果**
  - `PUT` は `addQueueService.execute` を呼ぶ。
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

## medium テストで担保する観点
- ルーター単体のハンドラー登録確認に加えて、`SessionStateAuthAdapter`・`SequelizeUserRepository`・`SequelizeMediaRepository` を組み合わせた追加 / 削除の永続化配線を `__tests__/medium/controller/router/user/` で段階的に担保する。
- medium では `favorite` / `queue` の API 応答だけでなく、後続のユーザー状態まで確認する。
