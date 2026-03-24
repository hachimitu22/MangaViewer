# router (DELETE /api/media/:mediaId) テストケース

## テストケース一覧
- [DELETE /api/media/:mediaId に2ハンドラーを順序どおり登録する](#delete-apimediamediaid-に2ハンドラーを順序どおり登録する)
- [登録済みハンドラーを順に実行すると認証後に削除サービスが呼ばれる](#登録済みハンドラーを順に実行すると認証後に削除サービスが呼ばれる)

---

### DELETE /api/media/:mediaId に2ハンドラーを順序どおり登録する
- **前提**
  - `router.delete` をモック化する。
  - `authResolver` / `deleteMediaService` は有効な依存を注入する。
- **操作**
  - `setRouterApiMediaDelete` を実行する。
- **結果**
  - `router.delete` が1回呼ばれる。
  - 第1引数が `/api/media/:mediaId` である。
  - 第2引数以降に2つのハンドラーが設定される。

---

### 登録済みハンドラーを順に実行すると認証後に削除サービスが呼ばれる
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `deleteMediaService.execute` は成功する。
- **操作**
  - ルーターに登録された2ハンドラーを `next` で順に実行する。
- **結果**
  - 認証処理が `session_token` で呼ばれる。
  - 削除処理が `mediaId` を使って実行される。
  - `200` + `code: 0` が返る。
