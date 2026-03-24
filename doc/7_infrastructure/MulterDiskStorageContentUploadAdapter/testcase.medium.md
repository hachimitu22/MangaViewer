# MulterDiskStorageContentUploadAdapter テストケース

## テストケース一覧
- [rootDirectory が不正な場合は初期化時に例外となる](#rootdirectory-が不正な場合は初期化時に例外となる)
- [新規ファイルと既存contentIdをposition順に処理し、新規ファイルを分割パスへ保存できる](#新規ファイルと既存contentidをposition順に処理し新規ファイルを分割パスへ保存できる)
- [保存先パスが衝突した場合はcontentIdを再生成して保存する](#保存先パスが衝突した場合はcontentidを再生成して保存する)
- [不正な multipart 入力の場合は cb(error) 相当の失敗レスポンスを返す](#不正な-multipart-入力の場合は-cberror-相当の失敗レスポンスを返す)

---

### rootDirectory が不正な場合は初期化時に例外となる
- 前提
  - なし
- 操作
  - `undefined` / `null` / 空文字の `rootDirectory` で生成する
- 期待結果
  - コンストラクタで `Error` が送出される

### 新規ファイルと既存contentIdをposition順に処理し、新規ファイルを分割パスへ保存できる
- 前提
  - 一時ディレクトリを保存先に使える
- 操作
  - 既存 `url` と新規 `file` を混在させて `/api/media` 相当の multipart リクエストを送る
- 期待結果
  - `contentIds` が `position` 順で返る
  - 新規ファイルには 32 文字小文字16進数 `contentId` が採番される
  - ファイルは分割ディレクトリ配下へ保存される

### 保存先パスが衝突した場合はcontentIdを再生成して保存する
- 前提
  - 生成候補の `contentId` に対応するファイルが既に存在する
- 操作
  - 新規ファイルアップロードを実行する
- 期待結果
  - 既存ファイルは上書きされない
  - 別の `contentId` が再生成され、そのパスへ保存される

### 不正な multipart 入力の場合は cb(error) 相当の失敗レスポンスを返す
- 前提
  - Web アプリ経由でアダプターを呼び出せる
- 操作
  - `position` 欠落、`file` と `url` の両方指定、両方欠落、無効な `contentId`、`position` 重複、不正 fieldname などでリクエストする
- 期待結果
  - `cb(error)` 相当の分岐へ入り、失敗レスポンスが返る
