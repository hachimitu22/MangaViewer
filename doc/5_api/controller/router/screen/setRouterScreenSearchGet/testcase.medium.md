# router (GET /screen/search) テストケース

## テストケース一覧
- [GET /screen/search に認証ガード付きルートを登録する](#get-screensearch-に認証ガード付きルートを登録する)
- [認証ガードは未認証時に 401 を返して描画へ進めない](#認証ガードは未認証時に-401-を返して描画へ進めない)
- [描画ハンドラーは screen/search を期待データで render する](#描画ハンドラーは-screensearch-を期待データで-render-する)

---

### GET /screen/search に認証ガード付きルートを登録する
- **前提**
  - `router.get` をモック化する。
  - `authResolver.execute` は有効な `userId` を返す。
- **操作**
  - `setRouterScreenSearchGet` を実行し、登録された第1・第2ハンドラーを取得する。
  - 第1ハンドラーへ有効な `session_token` を持つ `req` を渡す。
- **結果**
  - `router.get` が `/screen/search` と2つのハンドラーで1回呼ばれる。
  - 第1ハンドラーは `authResolver.execute` を用いて `req.context.userId` を設定し、`next()` を呼ぶ。

---

### 認証ガードは未認証時に 401 を返して描画へ進めない
- **前提**
  - `router.get` をモック化する。
- **操作**
  - `setRouterScreenSearchGet` 実行後、登録された第1ハンドラーへ `session_token` を持たない `req` を渡す。
- **結果**
  - `res.status(401).json({ message: '認証に失敗しました' })` が呼ばれる。
  - `next()` は呼ばれず、後続描画ハンドラーへ進まない。

---

### 描画ハンドラーは screen/search を期待データで render する
- **前提**
  - `router.get` をモック化する。
- **操作**
  - `setRouterScreenSearchGet` 実行後、登録された第2ハンドラーを実行する。
- **結果**
  - `res.status(200).render('screen/search', viewModel)` が呼ばれる。
  - `viewModel` に `pageTitle`、`summaryPage`、`start`、`size`、カテゴリー候補、タグ候補、ソート候補が含まれる。
