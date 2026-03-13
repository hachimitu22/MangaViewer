# MulterContentStorageResolver テストケース

## 前提
- `multer.memoryStorage()` を使ってテストする。
- HTTP レイヤーを通した実挙動確認のため、Express + Supertest で検証する。

## テストケース一覧

### TC-01: コンストラクタ異常系
- 条件: `multer()` の戻り値以外（`undefined`, `{}`）を渡す
- 期待値: `multer() の戻り値を指定してください。` エラーを送出する

### TC-02: contents アップロード正常系
- 条件: `resolveSingle('contents')` で `contents` フィールドに1ファイルを送信
- 期待値:
  - ステータス `200`
  - `contentId` はハイフン無し UUID（32桁16進文字列）
  - `filename === contentId`
  - `fileContentId === contentId`

### TC-03: ファイル未送信時の正常系
- 条件: `resolveSingle('contents')` に対してファイルなしで送信
- 期待値:
  - ステータス `200`
  - `req.file` は未設定（`hasFile === false`）
  - `contentId` は未設定（`null` で返却）
