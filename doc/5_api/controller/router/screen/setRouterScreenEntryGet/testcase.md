# router (GET /screen/entry) テストケース

## テストケース一覧
- [GET /screen/entry に認証・描画の2ハンドラーを登録する](#get-screenentry-に認証描画の2ハンドラーを登録する)
- [登録済みハンドラーを順に実行すると登録画面を描画する](#登録済みハンドラーを順に実行すると登録画面を描画する)

---

### GET /screen/entry に認証・描画の2ハンドラーを登録する
- **前提**
  - `router.get` をモック化する。
  - `authResolver` は有効な依存を注入する。
- **操作**
  - `setRouterScreenEntryGet` を実行する。
- **結果**
  - `router.get` が1回呼ばれる。
  - 第1引数が `/screen/entry` である。
  - 第2引数以降に2つのハンドラーが設定される。

---

### 登録済みハンドラーを順に実行すると登録画面を描画する
- **前提**
  - `authResolver.execute` は `userId` を返す。
- **操作**
  - 登録済みの2ハンドラーを順に実行する。
- **結果**
  - `screen/entry` がカテゴリ候補とタグ候補を含む表示データで描画される。
