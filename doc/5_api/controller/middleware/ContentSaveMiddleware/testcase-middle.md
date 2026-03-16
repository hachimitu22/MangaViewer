# ContentSaveMiddleware テストケース（middle）

## テストケース一覧
- [contents[n].file / position / url の構造で送信し、position順のcontentIdsで後続へ委譲できる](#contentsnfile--position--url-の構造で送信しposition順のcontentidsで後続へ委譲できる)
- [contents が未指定の場合は失敗レスポンスを返す](#contents-が未指定の場合は失敗レスポンスを返す)
- [contents[n].position が重複する場合は失敗レスポンスを返す](#contentsnposition-が重複する場合は失敗レスポンスを返す)

---

### contents[n].file / position / url の構造で送信し、position順のcontentIdsで後続へ委譲できる
- **前提**
  - Adapter は `multer(memoryStorage).any()` を使って multipart/form-data を受理する。
  - リクエストは `contents[n].file / contents[n].position / contents[n].url` を持つ。
  - 同名ファイルは許可し、`position` の異なる2件を送信する。
- **操作**
  - Express のルートに `ContentSaveMiddleware` を組み込み、`position` が逆順の2件を送信する。
- **結果**
  - `ContentSaveMiddleware` は失敗レスポンスを返さない。
  - 後続ハンドラへ委譲され、正常レスポンスを返す。

---

### contents が未指定の場合は失敗レスポンスを返す
- **前提**
  - Adapter は `multer(memoryStorage).any()` を使う。
  - リクエストに `contents[n].file` が含まれない（`req.files` が空）。
- **操作**
  - Express のルートに `ContentSaveMiddleware` を組み込み、ファイルなしの multipart/form-data を送信する。
- **結果**
  - `ContentSaveMiddleware` は `200` + `code: 1` を返す。
  - 後続ハンドラには委譲されない。

---

### contents[n].position が重複する場合は失敗レスポンスを返す
- **前提**
  - Adapter は `multer(memoryStorage).any()` を使う。
  - 同名ファイルは許可しつつ、`contents[n].position` が同じ2件を送信する。
- **操作**
  - Express のルートに `ContentSaveMiddleware` を組み込み、重複 `position` を送信する。
- **結果**
  - Adapter が `position` 重複を不正として error を返す。
  - `ContentSaveMiddleware` は `200` + `code: 1` を返す。
  - 後続ハンドラには委譲されない。
