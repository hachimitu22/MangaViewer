# router (GET /screen/edit/:mediaId) テストケース

## テストケース一覧
- [GET /screen/edit/:mediaId に認証・描画の2ハンドラーを登録する](#get-screeneditmediaid-に認証描画の2ハンドラーを登録する)
- [登録済みハンドラーを順に実行すると編集画面を描画する](#登録済みハンドラーを順に実行すると編集画面を描画する)
- [詳細取得で例外が発生した場合は next に委譲する](#詳細取得で例外が発生した場合は-next-に委譲する)
- [編集テンプレートの削除導線は確認後にのみ DELETE を実行する](#編集テンプレートの削除導線は確認後にのみ-delete-を実行する)

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
  - 既存コンテンツに `url`（`/contents/...` の公開パス）が付与される。

---

### 詳細取得で例外が発生した場合は next に委譲する
- **前提**
  - `getMediaDetailService.execute` が例外を送出する。
- **操作**
  - 描画ハンドラーを実行する。
- **結果**
  - `next(error)` が呼ばれる。

---

### 編集テンプレートの削除導線は確認後にのみ DELETE を実行する
- **前提**
  - `screen/edit` テンプレートを描画できる。
  - ブラウザーの確認ダイアログと `fetch` をスタブ化できる。
- **操作**
  1. 削除ボタン押下時に確認ダイアログでキャンセルする。
  2. 削除ボタン押下時に確認ダイアログで確定し、削除成功レスポンスを返す。
  3. 削除ボタン押下時に確認ダイアログで確定し、削除失敗レスポンスを返す。
- **結果**
  - キャンセル時は `DELETE /api/media/:mediaId` を呼ばず、編集画面に留まる。
  - 確定して成功した時は `DELETE /api/media/:mediaId` を呼び、`/screen/summary` へ遷移する。
  - 確定して失敗した時は編集画面に留まり、`form-message` にエラーメッセージを表示する。
