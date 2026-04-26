# router (GET /screen/detail/:mediaId) テストケース

## テストケース一覧
- [GET /screen/detail/:mediaId に描画ハンドラーを登録する](#get-screendetailmediaid-に描画ハンドラーを登録する)
- [登録済みハンドラーを実行すると詳細画面を描画する](#登録済みハンドラーを実行すると詳細画面を描画する)

---

### GET /screen/detail/:mediaId に描画ハンドラーを登録する
- **前提**
  - `router.get` をモック化する。
  - `getMediaDetailService` は有効な依存を注入する。
- **操作**
  - `setRouterScreenDetailGet` を実行する。
- **結果**
  - `router.get` が1回呼ばれる。
  - 第1引数が `/screen/detail/:mediaId` である。
  - 第2引数以降にハンドラーが設定される。

---

### 登録済みハンドラーを実行すると詳細画面を描画する
- **前提**
  - `getMediaDetailService.execute` はメディア詳細を返す。
- **操作**
  - 登録済みハンドラーを実行する。
- **結果**
  - 詳細取得処理が `mediaId` を使って実行される。
  - `screen/detail` が描画される。
  - `contents[*].thumbnail` は `/contents/...` の公開パスとして描画モデルへ渡される。

## medium テストで担保する観点
- `GetMediaDetailService` と実リポジトリを接続し、詳細画面描画までの統合を `__tests__/medium/controller/router/screen/` で担保する。
