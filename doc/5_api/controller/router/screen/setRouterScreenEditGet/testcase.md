# router (GET /screen/edit/:mediaId) テストケース

## テストケース一覧
- [GET /screen/edit/:mediaId に認証・描画の2ハンドラーを登録する](#get-screeneditmediaid-に認証描画の2ハンドラーを登録する)
- [登録済みハンドラーを順に実行すると編集画面を描画する](#登録済みハンドラーを順に実行すると編集画面を描画する)
- [詳細取得で例外が発生した場合は next に委譲する](#詳細取得で例外が発生した場合は-next-に委譲する)

---

### GET /screen/edit/:mediaId に認証・描画の2ハンドラーを登録する
- **前提**
  - `router.get` をモック化する。
  - `authResolver` / `getMediaDetailService` は有効な依存を注入する。
- **操作**
  - `setRouterScreenEditGet` を実行する。
- **結果**
  - `router.get` が1回呼ばれる。
  - 第1引数が `/screen/edit/:mediaId` である。
  - 第2引数以降に2つのハンドラーが設定される。

---

### 登録済みハンドラーを順に実行すると編集画面を描画する
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `getMediaDetailService.execute` はメディア詳細を返す。
- **操作**
  - 登録済みの2ハンドラーを順に実行する。
- **結果**
  - `screen/edit` が `pageTitle` やタグ候補を含む表示データで描画される。

---

### 詳細取得で例外が発生した場合は next に委譲する
- **前提**
  - `getMediaDetailService.execute` が例外を送出する。
- **操作**
  - 描画ハンドラーを実行する。
- **結果**
  - `next(error)` が呼ばれる。
