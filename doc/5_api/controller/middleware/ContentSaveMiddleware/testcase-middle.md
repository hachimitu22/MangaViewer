# ContentSaveMiddleware テストケース（middle）

## テストケース一覧
- [multer(memoryStorage)でアップロードされた複数ファイルのcontentIdsを検証し後続へ委譲できる](#multermemorystorageでアップロードされた複数ファイルのcontentidsを検証し後続へ委譲できる)
- [multer(memoryStorage)でファイル未指定の場合は失敗レスポンスを返す](#multermemorystorageでファイル未指定の場合は失敗レスポンスを返す)
- [multer(memoryStorage)で重複ファイル名を受けた場合は失敗レスポンスを返す](#multermemorystorageで重複ファイル名を受けた場合は失敗レスポンスを返す)

---

### multer(memoryStorage)でアップロードされた複数ファイルのcontentIdsを検証し後続へ委譲できる
- **前提**
  - Adapter は `multer(memoryStorage).any()` を使って multipart/form-data を受理する。
  - Adapter は `req.files` から `req.context.contentIds` を組み立てる。
  - 重複のない2件以上のファイル名を送信する。
- **操作**
  - Express のルートに `ContentSaveMiddleware` を組み込み、multipart/form-data を送信する。
- **結果**
  - `ContentSaveMiddleware` は失敗レスポンスを返さない。
  - 後続ハンドラへ委譲され、正常レスポンスを返す。

---

### multer(memoryStorage)でファイル未指定の場合は失敗レスポンスを返す
- **前提**
  - Adapter は `multer(memoryStorage).any()` を使う。
  - リクエストにファイルが含まれない（`req.files` が空）。
- **操作**
  - Express のルートに `ContentSaveMiddleware` を組み込み、ファイルなしの multipart/form-data を送信する。
- **結果**
  - `ContentSaveMiddleware` は `200` + `code: 1` を返す。
  - 後続ハンドラには委譲されない。

---

### multer(memoryStorage)で重複ファイル名を受けた場合は失敗レスポンスを返す
- **前提**
  - Adapter は `multer(memoryStorage).any()` を使う。
  - 同一ファイル名を含む複数ファイルを送信する。
- **操作**
  - Express のルートに `ContentSaveMiddleware` を組み込み、重複ファイル名を送信する。
- **結果**
  - `ContentSaveMiddleware` は `200` + `code: 1` を返す。
  - 後続ハンドラには委譲されない。
