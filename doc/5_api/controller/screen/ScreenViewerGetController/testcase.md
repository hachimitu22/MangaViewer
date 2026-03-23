# ScreenViewerGetController テストケース

## テストケース一覧
- [FoundResult の場合は viewer 画面を描画する](#foundresult-の場合は-viewer-画面を描画する)
- [動画拡張子の contentId は content.type を video にする](#動画拡張子の-contentid-は-contenttype-を-video-にする)
- [MediaNotFoundResult の場合はエラー画面へ 301 リダイレクトする](#medianotfoundresult-の場合はエラー画面へ-301-リダイレクトする)
- [ContentNotFoundResult の場合はエラー画面へ 301 リダイレクトする](#contentnotfoundresult-の場合はエラー画面へ-301-リダイレクトする)
- [想定外の戻り値や例外時はエラー画面へ 301 リダイレクトする](#想定外の戻り値や例外時はエラー画面へ-301-リダイレクトする)

---

### FoundResult の場合は viewer 画面を描画する
- **前提**
  - service が `FoundResult` を返す。
  - `previousContentId` / `nextContentId` の有無で導線を構築できる。
- **操作**
  - `execute(req, res)` を呼び出す。
- **結果**
  - service が整数化した `contentPosition` で呼び出される。
  - `screen/viewer` が `200` で描画される。
  - `pageTitle`、`content`、`previousPage`、`nextPage` が描画モデルに設定される。

---

### 動画拡張子の contentId は content.type を video にする
- **前提**
  - service が `contentId` に動画拡張子を持つ `FoundResult` を返す。
- **操作**
  - `execute(req, res)` を呼び出す。
- **結果**
  - 描画モデルの `content.type` が `video` になる。
  - `previousPage` / `nextPage` が `null` のときはそのまま `null` で描画される。

---

### MediaNotFoundResult の場合はエラー画面へ 301 リダイレクトする
- **前提**
  - service が `MediaNotFoundResult` を返す。
- **操作**
  - `execute(req, res)` を呼び出す。
- **結果**
  - `res.redirect(301, '/screen/error')` が呼ばれる。

---

### ContentNotFoundResult の場合はエラー画面へ 301 リダイレクトする
- **前提**
  - service が `ContentNotFoundResult` を返す。
- **操作**
  - `execute(req, res)` を呼び出す。
- **結果**
  - `res.redirect(301, '/screen/error')` が呼ばれる。

---

### 想定外の戻り値や例外時はエラー画面へ 301 リダイレクトする
- **前提**
  - service が `FoundResult` 以外の未知オブジェクトを返す、または例外を送出する。
- **操作**
  - `execute(req, res)` を呼び出す。
- **結果**
  - controller が想定外結果を例外化し、最終的に `res.redirect(301, '/screen/error')` を呼び出す。

## テスト責務の境界
- 認証ミドルウェアや route 登録の正しさは router テストで担保する。
- controller 単体では service 戻り値の分岐と viewer 描画モデル生成に限定して確認する。
