# ScreenDetailGetController テストケース

## テストケース一覧
- [mediaId を service に渡して詳細画面を描画する](#mediaid-を-service-に渡して詳細画面を描画する)
- [service 取得に失敗した場合はエラー画面へ 301 リダイレクトする](#service-取得に失敗した場合はエラー画面へ-301-リダイレクトする)

---

### mediaId を service に渡して詳細画面を描画する
- **前提**
  - `req.params.mediaId` に文字列のメディアIDが設定されている。
  - `getMediaDetailService.execute` は `mediaDetail` を含む結果を返す。
- **操作**
  - `execute(req, res)` を呼び出す。
- **結果**
  - service が `Input.mediaId = req.params.mediaId` で呼び出される。
  - `screen/detail` が `200` で描画される。
  - `pageTitle` と `mediaDetail` が描画モデルへ設定される。
  - `mediaDetail.categories` に詳細画面で表示するカテゴリー一覧が含まれる。

---

### service 取得に失敗した場合はエラー画面へ 301 リダイレクトする
- **前提**
  - `getMediaDetailService.execute` が例外を送出する。
- **操作**
  - `execute(req, res)` を呼び出す。
- **結果**
  - `res.redirect(301, '/screen/error')` が呼ばれる。
  - 例外内容に依存した分岐は持たない。

## テスト責務の境界
- 認証ミドルウェアとの接続、route path、実際の HTTP レスポンスは router / medium テストで担保する。
- controller 単体では入力変換・分岐・描画モデル生成のみを確認する。


## 今回の更新反映
- 追加出力/表示の確認対象に `登録日時` を追加する。
- 追加出力/表示の確認対象に `サムネイル表示用の contents(id / thumbnail / position)` を追加する。
- 追加出力/表示の確認対象に `カテゴリー一覧` を追加する。
- 追加出力/表示の確認対象に `タグ検索リンク` と既存の `優先カテゴリ` を追加する。
