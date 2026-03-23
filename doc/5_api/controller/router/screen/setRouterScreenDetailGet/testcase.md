# router (GET /screen/detail/:mediaId) テストケース

## テストケース一覧
- [GET /screen/detail/:mediaId に認証・描画の2ハンドラーを登録する](#get-screendetailmediaid-に認証描画の2ハンドラーを登録する)
- [登録済みハンドラーを順に実行すると詳細画面を描画する](#登録済みハンドラーを順に実行すると詳細画面を描画する)

---

### GET /screen/detail/:mediaId に認証・描画の2ハンドラーを登録する
- **前提**
  - `router.get` をモック化する。
  - `authResolver` / `getMediaDetailService` は有効な依存を注入する。
- **操作**
  - `setRouterScreenDetailGet` を実行する。
- **結果**
  - `router.get` が1回呼ばれる。
  - 第1引数が `/screen/detail/:mediaId` である。
  - 第2引数以降に2つのハンドラーが設定される。

---

### 登録済みハンドラーを順に実行すると詳細画面を描画する
- **前提**
  - `authResolver.execute` は `userId` を返す。
  - `getMediaDetailService.execute` はメディア詳細を返す。
- **操作**
  - ルーターに登録された2ハンドラーを `next` で順に実行する。
- **結果**
  - 認証処理が `session_token` で呼ばれる。
  - 詳細取得処理が `mediaId` を使って実行される。
  - `screen/detail` が描画される。
