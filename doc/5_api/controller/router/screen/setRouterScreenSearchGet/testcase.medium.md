# router (GET /screen/search) テストケース

## テストケース一覧
- [GET /screen/search に描画ハンドラーを登録する](#get-screensearch-に描画ハンドラーを登録する)
- [描画ハンドラーは screen/search を期待データで render する](#描画ハンドラーは-screensearch-を期待データで-render-する)

---

### GET /screen/search に描画ハンドラーを登録する
- **前提**
  - `router.get` をモック化する。
- **操作**
  - `setRouterScreenSearchGet` を実行し、登録されたハンドラーを取得する。
- **結果**
  - `router.get` が `/screen/search` とハンドラーで1回呼ばれる。

---

### 描画ハンドラーは screen/search を期待データで render する
- **前提**
  - `router.get` をモック化する。
- **操作**
  - `setRouterScreenSearchGet` 実行後、登録されたハンドラーを実行する。
- **結果**
  - `res.status(200).render('screen/search', viewModel)` が呼ばれる。
  - `viewModel` に `pageTitle`、`summaryPage`、`start`、`size`、カテゴリー候補、タグ候補、ソート候補が含まれる。
