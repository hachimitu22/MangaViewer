# ContentSaveMiddleware テストケース（small）

## テストケース一覧
- [uploadAdapter成功かつcontentIds正常時は後続へ委譲する](#uploadadapter成功かつcontentids正常時は後続へ委譲する)
- [contentIdsが不正な場合は失敗レスポンスを返し後続へ委譲しない](#contentidsが不正な場合は失敗レスポンスを返し後続へ委譲しない)
- [uploadAdapterがエラーを返した場合は失敗レスポンスを返し後続へ委譲しない](#uploadadapterがエラーを返した場合は失敗レスポンスを返し後続へ委譲しない)

---

### uploadAdapter成功かつcontentIds正常時は後続へ委譲する
- **前提**
  - `contentUploadAdapter.execute(req, res, cb)` が成功する。
  - `req.context.contentIds` が非空の文字列配列で重複がない。
- **操作**
  - `ContentSaveMiddleware` を実行する。
- **結果**
  - 失敗レスポンスは返さない。
  - `next()` が呼ばれる。

---

### contentIdsが不正な場合は失敗レスポンスを返し後続へ委譲しない
- **前提**
  - `contentUploadAdapter.execute(req, res, cb)` は成功する。
  - `req.context.contentIds` が未設定 / 配列以外 / 空 / 空文字列含む / 重複あり。
- **操作**
  - `ContentSaveMiddleware` を実行する。
- **結果**
  - `200` + `code: 1` を返す。
  - `next()` は呼ばれない。

---

### uploadAdapterがエラーを返した場合は失敗レスポンスを返し後続へ委譲しない
- **前提**
  - `contentUploadAdapter.execute(req, res, cb)` が error を返す。
- **操作**
  - `ContentSaveMiddleware` を実行する。
- **結果**
  - `200` + `code: 1` を返す。
  - `next()` は呼ばれない。
